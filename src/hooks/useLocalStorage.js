import { useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      if (item !== null) {
        const parsed = JSON.parse(item)
        console.log(`[useLocalStorage] READ key="${key}"`, parsed)
        return parsed
      }
    } catch (err) {
      console.error(`[useLocalStorage] Error reading key="${key}"`, err)
    }
    return initialValue
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      localStorage.setItem(key, JSON.stringify(valueToStore))
      console.log(`[useLocalStorage] WRITE key="${key}"`, valueToStore)
    } catch (err) {
      console.error(`[useLocalStorage] Error writing key="${key}"`, err)
    }
  }

  return [storedValue, setValue]
}
