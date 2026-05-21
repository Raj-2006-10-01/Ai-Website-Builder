import prisma from '../lib/prisma.js';
import openai from '../configs/openai.js';
const getSingleParam = (value) => Array.isArray(value) ? value[0] : value;
// function to make revision
export const makeRevision = async (req, res) => {
    const userId = req.userId;
    let creditsDeducted = false;
    try {
        const projectId = getSingleParam(req.params.projectId);
        const { message } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }
        if (typeof message !== 'string' || message.trim() === '') {
            return res.status(400).json({ message: 'Please enter a valid prompt' });
        }
        const trimmedMessage = message.trim();
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (user.credits < 5) {
            return res.status(403).json({ message: 'add more credites to make changes' });
        }
        const currentProject = await prisma.websiteProject.findFirst({
            where: { id: projectId, userId },
            include: { versions: true },
        });
        if (!currentProject) {
            return res.status(404).json({ message: 'Project not found' });
        }
        await prisma.conversation.create({
            data: {
                role: 'user',
                content: trimmedMessage,
                projectId
            }
        });
        await prisma.user.update({
            where: { id: userId },
            data: { credits: { decrement: 5 } }
        });
        creditsDeducted = true;
        // Enhance user prompt
        const promptEnhanceResponce = await openai.chat.completions.create({
            model: 'nvidia/nemotron-3-super-120b-a12b:free',
            messages: [
                {
                    role: 'system',
                    content: `
                    You are a prompt enhancement specialist. The user wants to make changes to their website. Enhance their request to be more specific and actionable for a web developer.

                    Enhance this by:
                    1. Being specific about what elements to change
                    2. Mentioning design details (colors, spacing, sizes)
                    3. Clarifying the desired outcome
                    4. Using clear technical terms

                    Return ONLY the enhanced request, nothing else. Keep it concise (1-2 sentences).`
                },
                {
                    role: 'user',
                    content: `user's request :${trimmedMessage}`
                }
            ]
        });
        const enhancePrompt = promptEnhanceResponce.choices[0].message.content;
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `i've enhanced your prompt to : ${enhancePrompt}`,
                projectId
            }
        });
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: 'Now making changes to your website...',
                projectId
            }
        });
        // generate website code
        const codegenerationresponce = await openai.chat.completions.create({
            model: 'nvidia/nemotron-3-super-120b-a12b:free',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert web developer. 
                    CRITICAL REQUIREMENTS:
                    - Return ONLY the complete updated HTML code with the requested changes.
                    - Use Tailwind CSS for ALL styling (NO custom CSS).
                    - Use Tailwind utility classes for all styling changes.
                    - Include all JavaScript in <script> tags before closing </body>
                    - Make sure it's a complete, standalone HTML document with Tailwind CSS
                    - Return the HTML Code Only, nothing else

                    Apply the requested changes while maintaining the Tailwind CSS styling approach.`
                },
                {
                    role: 'user',
                    content: `Here is the current website code "${currentProject.current_code}" the user want this change:"${enhancePrompt}"`
                }
            ]
        });
        const code = codegenerationresponce.choices[0].message.content || '';
        if (!code) {
            await prisma.conversation.create({
                data: {
                    role: 'assistant',
                    content: "Sorry, I couldn't make the changes to your website. Please try again with a different prompt.",
                    projectId
                }
            });
            await prisma.user.update({
                where: { id: userId },
                data: { credits: { increment: 5 } }
            });
            return;
        }
        const version = prisma.version.create({
            data: {
                code: code.replace(/```[a-z]*\n?/gi, '')
                    .replace(/```$/g, '')
                    .trim(),
                description: 'changes made',
                projectId
            }
        });
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: "I've made the changes to your website! you can now preview it",
                projectId
            }
        });
        await prisma.websiteProject.update({
            where: {
                id: projectId
            },
            data: {
                current_code: code.replace(/```[a-z]*\n?/gi, '')
                    .replace(/```$/g, '')
                    .trim(),
                current_version_index: (await version).id
            }
        });
        res.json({ message: 'changes made successfully' });
    }
    catch (error) {
        if (userId && creditsDeducted) {
            try {
                await prisma.user.update({
                    where: { id: userId },
                    data: { credits: { increment: 5 } }
                });
            }
            catch (refundError) {
                console.log(refundError.code || refundError.message);
            }
        }
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
// function to rollback to a specific version
export const rollbackToVersion = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const projectId = getSingleParam(req.params.projectId);
        const versionId = getSingleParam(req.params.versionId);
        if (!projectId || !versionId) {
            return res.status(400).json({ message: 'Project ID and version ID are required' });
        }
        const project = await prisma.websiteProject.findFirst({
            where: { id: projectId, userId },
            include: { versions: true }
        });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        const version = project.versions.find((version) => version.id === versionId);
        if (!version) {
            return res.status(404).json({ message: 'version not found' });
        }
        await prisma.websiteProject.update({
            where: { id: projectId, userId },
            data: {
                current_code: version.code,
                current_version_index: version.id
            }
        });
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: "I've rolled back your website to selected version. You can now preview it",
                projectId
            }
        });
        res.json({ message: 'Version rolled back' });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
// delete any project
export const deleteProject = async (req, res) => {
    try {
        const userId = req.userId;
        const projectId = getSingleParam(req.params.projectId);
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }
        await prisma.websiteProject.delete({
            where: { id: projectId, userId }
        });
        res.json({ message: 'project deleted successfully' });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
// for getting project code for preview
export const getProjectPreview = async (req, res) => {
    try {
        const userId = req.userId;
        const projectId = getSingleParam(req.params.projectId);
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }
        const project = await prisma.websiteProject.findFirst({
            where: { id: projectId, userId },
            include: { versions: true }
        });
        if (!project) {
            return res.status(401).json({ message: 'Project not found' });
        }
        res.json({ project });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
// ge Published project
export const getPublishedProject = async (req, res) => {
    try {
        const projects = await prisma.websiteProject.findMany({
            where: { isPublished: true },
            include: { user: true }
        });
        res.json({ projects });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
// get a single project by id
export const getProjectById = async (req, res) => {
    try {
        const projectId = getSingleParam(req.params.projectId);
        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }
        const project = await prisma.websiteProject.findFirst({
            where: { id: projectId }
        });
        if (!project || project.isPublished === false || !project.current_code) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json({ code: project.current_code });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
// to save the project
export const saveProjectCode = async (req, res) => {
    try {
        const userId = req.userId;
        const projectId = getSingleParam(req.params.projectId);
        const { code } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!projectId) {
            return res.status(400).json({ message: 'Project ID is required' });
        }
        if (!code) {
            return res.status(400).json({ message: 'Code is required' });
        }
        const project = await prisma.websiteProject.findFirst({
            where: { id: projectId, userId }
        });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        await prisma.websiteProject.update({
            where: { id: projectId },
            data: {
                current_code: code,
                current_version_index: ''
            }
        });
        res.json({ message: 'Project save successfully' });
    }
    catch (error) {
        console.log(error.code || error.message);
        res.status(500).json({ message: error.message });
    }
};
