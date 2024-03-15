import React, { useReducer } from 'react'
import { AuthReducer, initialState, DataReducer, initialData } from './reducer'

const AuthStateContext = React.createContext()
const AuthDispatchContext = React.createContext()
const DataContext = React.createContext()

export function useAuthState() {
  const context = React.useContext(AuthStateContext)
  if (context === undefined) {
    throw new Error('useAuthState must be used within a AuthProvider')
  }

  return context
}

export function useData() {
  const context = React.useContext(DataContext)
  if (context === undefined) {
    throw new Error('useData must be used within a AuthProvider')
  }

  return context
}

export function useAuthDispatch() {
  const context = React.useContext(AuthDispatchContext)
  if (context === undefined) {
    throw new Error('useAuthDispatch must be used within a AuthProvider')
  }

  return context
}

export const AuthProvider = ({ children }) => {
  const [user, dispatch] = useReducer(AuthReducer, initialState)
  const [data, dataDispatch] = useReducer(DataReducer, initialData)

  return (
    <AuthStateContext.Provider value={user}>
      <AuthDispatchContext.Provider value={dispatch}>
        <DataContext.Provider value={{ data, dataDispatch }}>
          {children}
        </DataContext.Provider>
      </AuthDispatchContext.Provider>
    </AuthStateContext.Provider>
  )
}
