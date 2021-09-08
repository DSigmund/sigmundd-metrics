import App from './app'

let app

app = new App(parseInt(process.argv[2]))


console.log(`metrics-example running on Port ${process.argv[2]}`)
