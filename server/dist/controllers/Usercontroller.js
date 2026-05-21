import prisma from '../lib/prisma.js';
import openai from '../configs/openai.js';
import Stripe from 'stripe';
// grt user credit
export const getUserCredits = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        res.json({ credits: user?.credits });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
// for new projects
export const createUserProject = async (req, res) => {
    const userId = req.userId;
    try {
        const { initial_prompt } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (user && user.credits < 5) {
            return res.status(403).json({ message: 'You need at least 5 credits to create a project.' });
        }
        const project = await prisma.websiteProject.create({
            data: {
                name: initial_prompt.length > 50 ? initial_prompt.substring(0, 47) + '...' : initial_prompt,
                initial_prompt,
                userId
            }
        });
        // update user total creation
        await prisma.user.update({
            where: { id: userId },
            data: { totalCreation: { increment: 1 } }
        });
        await prisma.conversation.create({
            data: {
                role: 'user',
                content: initial_prompt,
                projectId: project.id
            }
        });
        await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: 5 } }
        });
        res.json({ projectId: project.id });
        // Enhance user prompt
        const promptEnhanceResponce = await openai.chat.completions.create({
            model: 'nvidia/nemotron-3-super-120b-a12b:free',
            messages: [
                {
                    role: 'system',
                    content: `
                    You are a prompt enhancement specialist. Take the user's website request and expand it into a detailed, comprehensive prompt that will help create the best possible website.

                    Enhance this prompt by:
                    1. Adding specific design details (layout, color scheme, typography)
                    2. Specifying key sections and features
                    3. Describing the user experience and interactions
                    4. Including modern web design best practices
                    5. Mentioning responsive design requirements
                    6. Adding any missing but important elements

                    Return ONLY the enhanced prompt, nothing else. Make it detailed but concise (2-3 paragraphs max).
                    `
                },
                {
                    role: 'user',
                    content: initial_prompt
                }
            ]
        });
        const enhanceprompt = promptEnhanceResponce.choices[0].message.content;
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `I've enhanced your prompt to : "${enhanceprompt}"`,
                projectId: project.id
            }
        });
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: 'now generating your website...',
                projectId: project.id
            }
        });
        // generate website code
        const generationresponce = await openai.chat.completions.create({
            model: 'nvidia/nemotron-3-super-120b-a12b:free',
            messages: [
                {
                    role: 'system',
                    content: `
                    You are an expert web developer. Create a complete, production-ready, single-page website based on this request: "${enhanceprompt}"

                    CRITICAL REQUIREMENTS:
                    - You MUST output valid HTML ONLY. 
                    - Use Tailwind CSS for ALL styling
                    - Include this EXACT script in the <head>: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
                    - Use Tailwind utility classes extensively for styling, animations, and responsiveness
                    - Make it fully functional and interactive with JavaScript in <script> tag before closing </body>
                    - Use modern, beautiful design with great UX using Tailwind classes
                    - Make it responsive using Tailwind responsive classes (sm:, md:, lg:, xl:)
                    - Use Tailwind animations and transitions (animate-*, transition-*)
                    - Include all necessary meta tags
                    - Use Google Fonts CDN if needed for custom fonts
                    - Use placeholder images from https://placehold.co/600x400
                    - Use Tailwind gradient classes for beautiful backgrounds
                    - Make sure all buttons, cards, and components use Tailwind styling

                    CRITICAL HARD RULES:
                    1. You MUST put ALL output ONLY into message.content.
                    2. You MUST NOT place anything in "reasoning", "analysis", "reasoning_details", or any hidden fields.
                    3. You MUST NOT include internal thoughts, explanations, analysis, comments, or markdown.
                    4. Do NOT include markdown, explanations, notes, or code fences.

                    The HTML should be complete and ready to render as-is with Tailwind CSS.`
                },
                {
                    role: 'user',
                    content: enhanceprompt || ''
                }
            ]
        });
        const code = generationresponce.choices[0].message.content || '';
        if (!code) {
            await prisma.conversation.create({
                data: {
                    role: 'assistant',
                    content: "Sorry, I couldn't make the changes to your website. Please try again with a different prompt.",
                    projectId: project.id
                }
            });
            await prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: 5 } }
            });
            return;
        }
        // create version for the projects
        const version = await prisma.version.create({
            data: {
                code: code.replace(/```[a-z]*\n?/gi, '')
                    .replace(/```$/g, '')
                    .trim(),
                description: 'Initial version',
                projectId: project.id
            }
        });
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: "I've created your website! You can preview it and request any changes.",
                projectId: project.id
            }
        });
        await prisma.websiteProject.update({
            where: { id: project.id },
            data: {
                current_code: code.replace(/```[a-z]*\n?/gi, '')
                    .replace(/```$/g, '')
                    .trim(),
                current_version_index: version.id
            }
        });
    }
    catch (error) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { increment: 5 }
            }
        });
        console.log(error.code);
        res.status(500).json({ message: error.message });
    }
};
// to get a single user project
export const getUserProject = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const projectId = req.params.projectId;
        const project = await prisma.websiteProject.findUnique({
            where: {
                id: projectId,
                userId
            },
            include: {
                conversation: {
                    orderBy: { timestamp: 'asc' }
                },
                versions: { orderBy: { timestamp: 'asc' } }
            }
        });
        res.json({ project });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
// get all user project
export const getUserProjects = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const projects = await prisma.websiteProject.findMany({
            where: {
                userId
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json({ projects });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
// To Toggle project publish..
export const togglePublish = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const projectId = req.params.projectId;
        const project = await prisma.websiteProject.findUnique({
            where: { id: projectId, userId }
        });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        await prisma.websiteProject.update({
            where: { id: projectId },
            data: { isPublished: !project.isPublished }
        });
        res.json({ message: project.isPublished ? 'Project Unpublished' : 'Project Published Successfully' });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
// to purchase credits
export const purchesCredits = async (req, res) => {
    try {
        const plans = {
            basic: { credits: 100, amount: 5 },
            pro: { credits: 400, amount: 19 },
            enterprise: { credits: 1000, amount: 49 },
        };
        const userId = req.userId;
        const { planId } = req.body;
        const origin = req.headers.origin;
        const plan = plans[planId];
        if (!plan) {
            return res.status(404).json({ message: 'Invalid plan selected' });
        }
        if (!userId)
            return res.status(401).json({ message: 'Unauthorized' });
        const transaction = await prisma.transaction.create({
            data: {
                userId: userId,
                planId: req.body.planId,
                amount: plan.amount,
                credits: plan.credits
            }
        });
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/pricing`,
            cancel_url: `${origin}`,
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `AisiteBuilder ${plan.credits} Credits Pack`
                        },
                        unit_amount: Math.floor(transaction.amount * 100)
                    },
                    quantity: 1
                },
            ],
            mode: 'payment',
            metadata: {
                transactionId: transaction.id,
                appId: 'Ai-site-Builder'
            },
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60) // session expires in 30 minutes
        });
        res.json({ payment_link: session.url });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
