// ==============================
// index.html
function connectSocket() {
    // =====Socket connection to admin server
    const socket = io("https://cogteach.com/admin", {
        autoConnect: false,
        auth: {
            identity: document.getElementById("identity-0").checked ? 1 : 2,
            name: document.getElementById("identity-0").checked ?
                [document.getElementById("first-name").value, document.getElementById("last-name").value].join(' ') : 'Instructor',
        }
    });
    // In case the same user logs in several times
    const sessionID = sessionStorage.getItem("sessionID");
    if (sessionID) {
        socket.auth = { sessionID };
    }
    socket.connect();
    console.log(socket);

    socket.on("session", ({ sessionID, userID }) => {
        // attach the session ID to the next reconnection attempts
        socket.auth = { sessionID };
        // store it in the localStorage
        sessionStorage.setItem("sessionID", sessionID);
        // save the ID of the user
        socket.userID = userID;
        // Session information is stored. Now redirect to new pages.
        if (document.getElementById('identity-0').checked) {
            window.open('studentPage.html', '_self');
        } else {
            window.open('teacherPage.html', '_self');
        }
    });
}
// ==============================
// globalVars.js

// SessionID should've been stored on index.html
const sessionID = sessionStorage.getItem("sessionID");
if (sessionID) {
    socket.auth = { sessionID };
}

// ==============================
// dedicated_server.js

/* abstract */
class SessionStore {
    findSession(id) {
    }

    saveSession(id, session) {
    }

    findAllSessions() {
    }
}

class InMemorySessionStore extends SessionStore {
    constructor() {
        super();
        this.sessions = new Map();
    }

    findSession(id) {
        return this.sessions.get(id);
    }

    saveSession(id, session) {
        this.sessions.set(id, session);
    }

    findAllSessions() {
        return [...this.sessions.values()];
    }
}

let sessionStore = new InMemorySessionStore();

adminNamespace.use((socket, next) => {
    const sessionID = socket.handshake.auth.sessionID;
    if (sessionID) {
        // find existing session
        const session = sessionStore.findSession(sessionID);
        if (session) {

            logger.info('============================')
            logger.info('Existing socket.')
            logger.info(`session.name: ${session.name}`);
            logger.info(`session.identity: ${session.identity}`);

            socket.sessionID = sessionID;
            socket.userID = session.userID;
            socket.name = session.name;
            socket.identity = session.identity;
            return next();
        }
    }
    // create new session
    socket.sessionID = randomId();
    socket.userID = randomId();
    socket.name = socket.handshake.auth.name;
    socket.identity = socket.handshake.auth.identity;

    logger.info('============================')
    logger.info('New socket.')
    logger.debug(`socket.handshake.auth.name: ${socket.handshake.auth.name}`);
    logger.debug(`socket.handshake.auth.identity: ${socket.handshake.auth.identity}`);
    logger.info(`socket.name: ${socket.name}`);
    logger.info(`socket.identity: ${socket.identity}`);

    next();
})

// adminNamespace.on("connection")
socket.emit("session", {
    sessionID: socket.sessionID,
    userID: socket.userID,
});

// socket.on('disconnect')
// update the connection status of the session
sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    name: socket.name,
    identity: socket.identity,
    connected: false,
});

// ==============================
// admin.html

const sessionID = sessionStorage.getItem("sessionID");
if (sessionID) {
    socket.auth = {sessionID}; // assignment are converted to object merge, do not overwrite
}
socket.connect();

socket.on("session", ({sessionID, userID}) => {
    // attach the session ID to the next reconnection attempts
    socket.auth = {sessionID};
    // store it in the sessionStorage
    sessionStorage.setItem("sessionID", sessionID);
    // save the ID of the user
    socket.userID = userID;
});

// ==============================
// student_client.js

userInfo = getCookie('userInfo');
if (!userInfo) throw Error('No user information. Please log in.');
userInfo = JSON.parse(userInfo);