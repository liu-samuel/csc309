import React, { createContext, useContext, useState } from 'react'

const AuthContext = createContext({
    user: null,
    login: () => {},
    logout: () => {},
})

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)

    const login = (username, firstName, lastName, email, token) => {
        setUser({ username, firstName, lastName, email, token })
    }

    const logout = () => {
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
