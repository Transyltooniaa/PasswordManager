const dotenv = require('dotenv')
dotenv.config()

const { createApp } = require('./src/app')

const PORT = process.env.PORT || 3000

createApp().then(app => {
    app.listen(PORT, () => {
        console.log(`PassOP backend listening on port ${PORT}`)
    })
}).catch(err => {
    console.error('Failed to start server', err)
    process.exit(1)
})
