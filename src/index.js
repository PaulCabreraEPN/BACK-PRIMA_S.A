import app from './server.js';
import connection from './config/database.js';

app.listen(app.get('port'),()=>{
    console.log(`Server ok on http://localhost:${app.get('port')}`);
})

connection()