import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext({
    user: undefined,
    login: (username, firstName, lastName, email, token) => {},
    logout: () => {},
})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Attempt to get a user from localStorage on initial load
        const savedUser = localStorage.getItem('user')
        return savedUser ? JSON.parse(savedUser) : undefined
    })

    useEffect(() => {
        // Whenever the user changes, update localStorage
        if (user) {
            localStorage.setItem('user', JSON.stringify(user))
        } else {
            localStorage.removeItem('user')
        }
    }, [user])

    const login = (username, firstName, lastName, email, token) => {
        setUser({ username, firstName, lastName, email, token })
    }

    const logout = () => {
        setUser(undefined)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
