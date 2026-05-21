import api from '@/configs/axios';
import { authClient } from '@/lib/auth-client';
import { Loader2Icon } from 'lucide-react';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const companyNames = ['Framer', 'Huawei', 'Instagram', 'Microsoft', 'Walmart']

const Home = () => {
  const {data:session}=authClient.useSession()
  const navigate=useNavigate()
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = useState(false)
  const onSubmitHandler = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) {
      return
    }

    try {
      if (!session?.user) {
        return toast.error('please sign in to create a project')
      }else if (!input.trim()) {
        return toast.error('Please enter a message')
      }
      setLoading(true)
      const {data}=await api.post('/api/user/project',{initial_prompt:input});
      setLoading(false);
      navigate(`/projects/${data.projectId}`)
    } catch (error:any) {
      setLoading(false)
      toast.error(error?.response?.data?.message || error.message);
    }

    
  }

  return (
    <section className="flex flex-col items-center text-white text-sm pb-20 px-4 font-poppins">
      {/* BACKGROUND IMAGE */}
      <img src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/refs/heads/main/assets/hero/bg-gradient-2.png" className="absolute inset-0 -z-10 size-full opacity" alt="" />

      <a href="https://prebuiltui.com" className="flex items-center gap-2 border border-slate-700 rounded-full p-1 pr-3 text-sm mt-20">
        <span className="bg-indigo-600 text-xs px-3 py-1 rounded-full">NEW</span>
        <p className="flex items-center gap-2">
          <span>Try 30 days free trial option</span>
          <svg className="mt-px" width="6" height="9" viewBox="0 0 6 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m1 1 4 3.5L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </p>
      </a>

      <h1 className="text-center text-[40px] leading-12 md:text-6xl md:leading-17.5 mt-4 font-semibold max-w-3xl">
        Turn thoughts into websites instantly, with AI.
      </h1>

      <p className="text-center text-base max-w-md mt-2">
        Create, customize and publish website faster than ever with our Ai Site Builder.
      </p>

      <form onSubmit={onSubmitHandler} className="bg-white/10 max-w-2xl w-full rounded-xl p-4 mt-10 border border-indigo-600/70 focus-within:ring-2 ring-indigo-500 transition-all">
        <textarea onChange={e => setInput(e.target.value)} className="bg-transparent outline-none text-gray-300 resize-none w-full" rows={4} placeholder="Describe your presentation in details" required />
        <button disabled={loading} className="ml-auto flex items-center gap-2 bg-linear-to-r from-[#CB52D4] to-indigo-600 rounded-md px-4 py-2 disabled:cursor-not-allowed disabled:opacity-70">
          {!loading ? 'Create with Ai' :(
            <>
            Creating <Loader2Icon className='animate-spin size-4 text-white'/>
            </>
          )}
        
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mx-auto mt-16">
        {companyNames.map((company) => (
          <span
            key={company}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70"
          >
            {company}
          </span>
        ))}
      </div>
    </section>
  )
}

export default Home
