import { handleAnonymousLogin } from "./firebase/fbInstance";

function App() {
    return (
        <div>
            <button onClick={handleAnonymousLogin}>익명 로그인</button>
        </div>
    );
}

export default App;
