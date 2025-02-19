import React from 'react'

const NewsletterBox = () => {

    const onSubmitHandler = (event) => {
        event.preventDefault();
    }

    return (
        <div className='text-center'>
            <p className='text-2xl font-medium text-gray-800'>Subscribe to our newsletter</p>
            <p className='text-gray-400 mt-3'>
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Vitae, natus nesciunt
                dolorem dolor sint voluptates qui consectetur sunt pariatur assumenda nostrum
                velit delectus fuga accusamus iusto nemo recusandae maiores architecto.
            </p>

            <form onSubmit={onSubmitHandler} className='w-full sm:w-1/2 flex items-center gap-3 mx-auto my-6 pl-3 border border-gray-500 rounded-lg'>
                <input
                    type='email'
                    placeholder='Enter your email address'      
                    className='w-full sm:flex-1 outline-none text-center rounded-lg'
                    required
                />
                <button type='submit' className='px-10 py-4 bg-black text-white text-xs rounded-r-lg' >
                    Subscribe
                </button>
            </form>
        </div>
    )
}

export default NewsletterBox