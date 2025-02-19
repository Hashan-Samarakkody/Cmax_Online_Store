import React from 'react'

const Login = () => {
  return (
    <div>
      <h1>Admin Panel</h1>
      <form action="">
        <div>
          <p className='text-sm font-medium text-gray-700 mb-2'>Email Address</p>
          <input className='rounded-md w-full px-3 py-2 border border-gray-300 outline-none' type="email" placeholder='your@email.com' required/>
        </div>
        <div>
          <p className='text-sm font-medium text-gray-700 mb-2'>Password</p>
          <input className='rounded-md w-full px-3 py-2 border border-gray-300 outline-none' type="password" placeholder='Enter your Password' required/>
        </div>
        <button type='submit' className='bg-blue-500 text-white p-2 rounded-md'>Login</button>
      </form>
      </div>
  )
}

export default Login