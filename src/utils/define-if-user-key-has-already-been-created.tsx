const defineIfKeyHasAlreadyBeenCreated = async () => {
    window.postMessage({
      type: 'HAS_USER_KEY',
    }, '*') // You can restrict the origin in production

    console.log('SENT!!!')
    return new Promise((resolve, reject) => {
      const listener = (event: any) => {
        console.log('listener: ', {
          event
        })
        switch (event.data.type) {
          //  from client to extension
          case 'HAS_USER_KEY_RESPONSE': {
            resolve(event.data.data.hasUserKey)
            window.removeEventListener("message", listener)
            break
          }
        }
      }
  
      window.addEventListener("message", listener)

      window.setTimeout(() => {
        resolve(false)
        window.removeEventListener("message", listener)
      }, 1500)
    })
}

export default defineIfKeyHasAlreadyBeenCreated