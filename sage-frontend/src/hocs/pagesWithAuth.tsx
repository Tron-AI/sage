// import { useRouter } from 'next/router'

// export function withAuth(Component) {
//   return function WithAuth(props) {
//     const router = useRouter()

//     // Add your authentication logic here
//     // For example, check if the user is authenticated
//     const token = localStorage.getItem('accessToken')

//     if (!token) {
//       router.push('/login') // Redirect to login if no token is present

//       return null
//     }

//     return <Component {...props} />
//   }
// }

import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

const PageWithAuth = (Component: NextPage) => {
  const AuthenticatedComponent = (props: any) => {
    const router = useRouter()
    const [isAuth, setIsAuth] = useState<boolean>(false)

    useEffect(() => {
      const checkAuth = () => {
        const isAuthenticated = localStorage.getItem('accessToken')

        if (!isAuthenticated) {
          router.push('/login') // Redirect to login if no token is present
        } else {
          setIsAuth(true) // Mark as authenticated
        }
      }

      checkAuth()
    }, [router])

    if (!isAuth) {
      return null // Optionally, show a loading spinner here
    }

    return <Component {...props} />
  }

  return AuthenticatedComponent
}

export default PageWithAuth
