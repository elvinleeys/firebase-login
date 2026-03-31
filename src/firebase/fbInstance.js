// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    linkWithPopup,
    signInAnonymously,
    signInWithPopup,
    signOut,
} from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: import.meta.env.VITE_APP_API_KEY,
    authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_APP_PROJECT_ID,
    storageBucket: import.meta.env.VITE_APP_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_APP_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_APP_APP_ID,
    measurementId: import.meta.env.VITE_APP_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export const handleAnonymousLogin = async () => {
    try {
        const userCredential = await signInAnonymously(auth);
        const user = userCredential.user;

        const uid = user.uid;
        const accessToken = await user.getIdToken(); // 중요

        // 서버로 전달
        console.log("UID:", uid);
        console.log("Access Token:", accessToken);
    } catch (error) {
        console.error(error);
    }
};

export const handleGoogleLogin = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const uid = user.uid;
        const email = user.email;
        const token = await user.getIdToken(); // 핵심

        // 서버로 전달
        console.log("UID:", uid);
        console.log("Email:", email);
        console.log("Access Token:", token);
    } catch (error) {
        console.error(error);
    }
};

// 계정 연결 함수
export const handleLinkAccount = async () => {
    try {
        const result = await linkWithPopup(auth.currentUser, provider);
        const user = result.user;

        const token = await user.getIdToken();

        // await sendToServer({
        //   uid: user.uid, // 기존 uid 유지됨
        //   email: user.email,
        //   token,
        //   provider: "google",
        // });
    } catch (error) {
        console.error(error);
    }
};

// 로그아웃 함수
export const handleLogout = async () => {
    try {
        await signOut(auth);

        // 선택: 서버에도 로그아웃 알림
        // await axios.post("http://localhost:8080/api/logout");
    } catch (error) {
        console.error(error);
    }
};
