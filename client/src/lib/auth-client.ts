import { createAuthClient } from "better-auth/react"

const getAuthBaseURL = () => {
    if (import.meta.env.VITE_BASEURL) {
        return import.meta.env.VITE_BASEURL
    }
    return 'http://localhost:3000'
}

export const authClient = createAuthClient({
    baseURL: getAuthBaseURL(),
    fetchOptions: {
        credentials: 'include'
    },
})

export const { signIn, signUp, useSession } = authClient;