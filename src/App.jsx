import {
    getApps,
    initializeApp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    createUserWithEmailAndPassword,
    getAuth,
    GoogleAuthProvider,
    signInAnonymously,
    signInWithEmailAndPassword,
    signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { useState } from "react";

// ── fbInstance.js 내용 인라인 (실제 프로젝트에서는 import { auth } from './firebase/fbInstance.js')
const firebaseConfig = {
    apiKey: "AIzaSyCl0VwazjNdlMJUxJWVsLhhewhpkejg1Gg",
    // 나머지 값은 .env에서 import.meta.env.VITE_APP_* 로 주입
    // authDomain, projectId 등은 실제 프로젝트 .env에 설정 필요
};

const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const SPRING = "http://localhost:3001";

const ERR = {
    "auth/user-not-found": "등록되지 않은 이메일입니다.",
    "auth/wrong-password": "비밀번호가 올바르지 않습니다.",
    "auth/invalid-email": "이메일 형식이 올바르지 않습니다.",
    "auth/email-already-in-use": "이미 사용 중인 이메일입니다.",
    "auth/weak-password": "비밀번호는 6자 이상이어야 합니다.",
    "auth/invalid-credential": "이메일 또는 비밀번호가 올바르지 않습니다.",
    "auth/too-many-requests": "잠시 후 다시 시도해주세요.",
    "auth/operation-not-allowed": "이 로그인 방식이 비활성화되어 있습니다.",
    "auth/popup-closed-by-user": "Google 로그인 창이 닫혔습니다.",
};
const parseErr = (code) => ERR[code] || "오류가 발생했습니다.";

async function mockSpring(idToken, uid, provider) {
    // 실제: axios.post(`${SPRING}/api/auth/verify`, {}, { headers: { Authorization: `Bearer ${idToken}` } })
    return new Promise((r) =>
        setTimeout(
            () => r({ uid, provider, message: "Spring 서버 인증 성공" }),
            600,
        ),
    );
}

export default function App() {
    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("");
    const [pw, setPw] = useState("");
    const [loading, setLoading] = useState(null);
    const [error, setError] = useState("");
    const [user, setUser] = useState(null);
    const [serverRes, setServerRes] = useState(null);

    const finalize = async (fbUser, provider) => {
        const idToken = await fbUser.getIdToken();
        const res = await mockSpring(idToken, fbUser.uid, provider);
        setServerRes(res);
        setUser({
            email: fbUser.email || (provider === "anonymous" ? "(익명)" : ""),
            displayName: fbUser.displayName || null,
            photo: fbUser.photoURL || null,
            uid: fbUser.uid,
            idToken,
            provider,
        });
    };

    const handleEmail = async () => {
        setError("");
        if (!email || !pw) {
            setError("이메일과 비밀번호를 입력해주세요.");
            return;
        }
        setLoading("email");
        try {
            const cred =
                mode === "login"
                    ? await signInWithEmailAndPassword(auth, email, pw)
                    : await createUserWithEmailAndPassword(auth, email, pw);
            await finalize(cred.user, "email");
        } catch (e) {
            setError(parseErr(e.code));
        } finally {
            setLoading(null);
        }
    };

    const handleAnon = async () => {
        setError("");
        setLoading("anon");
        try {
            const cred = await signInAnonymously(auth);
            await finalize(cred.user, "anonymous");
        } catch (e) {
            setError(parseErr(e.code));
        } finally {
            setLoading(null);
        }
    };

    const handleGoogle = async () => {
        setError("");
        setLoading("google");
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await finalize(result.user, "google");
        } catch (e) {
            setError(parseErr(e.code));
        } finally {
            setLoading(null);
        }
    };

    const handleLogout = async () => {
        await auth.signOut?.();
        setUser(null);
        setEmail("");
        setPw("");
        setError("");
        setServerRes(null);
    };

    if (user) {
        const badge = {
            email: "✉️ 이메일",
            anonymous: "👤 익명",
            google: "🔵 Google",
        }[user.provider];
        return (
            <div style={s.bg}>
                <div style={s.card}>
                    {user.photo ? (
                        <img
                            src={user.photo}
                            style={s.avatarImg}
                            alt="profile"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div
                            style={{
                                ...s.avatar,
                                background: {
                                    anonymous: "#888",
                                    google: "#4285F4",
                                    email: "#111",
                                }[user.provider],
                            }}
                        >
                            {user.provider === "anonymous"
                                ? "?"
                                : (user.displayName ||
                                      user.email ||
                                      "U")[0].toUpperCase()}
                        </div>
                    )}
                    <h2 style={s.wTitle}>로그인 성공!</h2>
                    {user.displayName && (
                        <p
                            style={{
                                ...s.sub,
                                fontWeight: 600,
                                color: "#333",
                                marginBottom: 2,
                            }}
                        >
                            {user.displayName}
                        </p>
                    )}
                    <p style={s.sub}>{user.email}</p>
                    <div style={s.badge}>{badge}</div>

                    <div style={s.section}>
                        <p style={s.sLabel}>Firebase UID</p>
                        <div style={s.mono}>{user.uid}</div>
                    </div>
                    <div style={s.section}>
                        <p style={s.sLabel}>ID Token (앞 40자)</p>
                        <div style={s.mono}>{user.idToken.slice(0, 40)}...</div>
                    </div>
                    {serverRes && (
                        <div style={s.serverBox}>
                            <p style={s.sLabel}>🖥 Spring 서버 응답</p>
                            <div style={s.mono}>
                                {JSON.stringify(serverRes, null, 2)}
                            </div>
                        </div>
                    )}
                    <button style={s.btn} onClick={handleLogout}>
                        로그아웃
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={s.bg}>
            <div style={s.card}>
                <h1 style={s.title}>
                    {mode === "login" ? "로그인" : "회원가입"}
                </h1>
                <p style={s.sub}>
                    {mode === "login"
                        ? "계정에 로그인하세요"
                        : "새 계정을 만드세요"}
                </p>

                <button
                    style={s.googleBtn}
                    onClick={handleGoogle}
                    disabled={!!loading}
                >
                    {loading === "google" ? (
                        "처리 중..."
                    ) : (
                        <>
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 48 48"
                                style={{ marginRight: 8 }}
                            >
                                <path
                                    fill="#EA4335"
                                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                                />
                                <path
                                    fill="#4285F4"
                                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                                />
                            </svg>
                            Google 계정으로{" "}
                            {mode === "login" ? "로그인" : "가입"}
                        </>
                    )}
                </button>

                <div style={s.orRow}>
                    <div style={s.line} />
                    <span style={s.orText}>또는 이메일로</span>
                    <div style={s.line} />
                </div>

                <div style={s.field}>
                    <label style={s.label}>이메일</label>
                    <input
                        style={s.input}
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleEmail()}
                    />
                </div>
                <div style={s.field}>
                    <label style={s.label}>비밀번호</label>
                    <input
                        style={s.input}
                        type="password"
                        placeholder="••••••••"
                        value={pw}
                        onChange={(e) => {
                            setPw(e.target.value);
                            setError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && handleEmail()}
                    />
                </div>

                {error && <div style={s.error}>{error}</div>}

                <button
                    style={{ ...s.btn, opacity: loading === "email" ? 0.7 : 1 }}
                    onClick={handleEmail}
                    disabled={!!loading}
                >
                    {loading === "email"
                        ? "처리 중..."
                        : mode === "login"
                          ? "이메일로 로그인"
                          : "이메일로 가입"}
                </button>

                <div style={s.orRow}>
                    <div style={s.line} />
                    <span style={s.orText}>또는</span>
                    <div style={s.line} />
                </div>

                <button
                    style={{
                        ...s.anonBtn,
                        opacity: loading === "anon" ? 0.7 : 1,
                    }}
                    onClick={handleAnon}
                    disabled={!!loading}
                >
                    {loading === "anon" ? "처리 중..." : "👤 익명으로 시작하기"}
                </button>

                <div style={s.divider} />
                <p style={s.switchText}>
                    {mode === "login"
                        ? "계정이 없으신가요?"
                        : "이미 계정이 있으신가요?"}
                    <span
                        style={s.switchLink}
                        onClick={() => {
                            setMode(mode === "login" ? "signup" : "login");
                            setError("");
                        }}
                    >
                        {mode === "login" ? " 회원가입" : " 로그인"}
                    </span>
                </p>

                <div style={s.codeBox}>
                    <p style={s.codeTitle}>
                        📁 firebase/fbInstance.js 연동 구조
                    </p>
                    <pre style={s.code}>{`// firebase/fbInstance.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_API_KEY,
  authDomain: import.meta.env.VITE_APP_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_PROJECT_ID,
  ...
};
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// LoginPage.jsx
import { auth } from "./firebase/fbInstance";
import { signInWithEmailAndPassword } from "firebase/auth";`}</pre>
                </div>
            </div>
        </div>
    );
}

const s = {
    bg: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f5f5f5",
        fontFamily: "sans-serif",
    },
    card: {
        background: "#fff",
        borderRadius: 16,
        padding: "36px 32px",
        width: 380,
        boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
    },
    title: { fontSize: 22, fontWeight: 700, margin: "0 0 4px", color: "#111" },
    sub: { fontSize: 13, color: "#888", margin: "0 0 20px" },
    googleBtn: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "11px",
        background: "#fff",
        color: "#444",
        border: "1px solid #ddd",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        marginBottom: 4,
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    },
    orRow: { display: "flex", alignItems: "center", margin: "14px 0" },
    line: { flex: 1, height: 1, background: "#eee" },
    orText: {
        fontSize: 11,
        color: "#bbb",
        margin: "0 10px",
        whiteSpace: "nowrap",
    },
    field: { marginBottom: 14 },
    label: {
        display: "block",
        fontSize: 12,
        fontWeight: 600,
        color: "#555",
        marginBottom: 5,
    },
    input: {
        width: "100%",
        padding: "10px 12px",
        fontSize: 14,
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        outline: "none",
        boxSizing: "border-box",
        background: "#fafafa",
    },
    error: {
        background: "#fff0f0",
        color: "#d32f2f",
        fontSize: 12,
        padding: "9px 12px",
        borderRadius: 8,
        marginBottom: 10,
    },
    btn: {
        width: "100%",
        padding: "11px",
        background: "#111",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        marginTop: 2,
    },
    anonBtn: {
        width: "100%",
        padding: "11px",
        background: "#f5f5f5",
        color: "#444",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
    },
    divider: { height: 1, background: "#f0f0f0", margin: "20px 0" },
    switchText: {
        textAlign: "center",
        fontSize: 12,
        color: "#888",
        margin: "0 0 16px",
    },
    switchLink: {
        color: "#111",
        fontWeight: 600,
        cursor: "pointer",
        textDecoration: "underline",
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: "50%",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        fontWeight: 700,
        margin: "0 auto 14px",
    },
    avatarImg: {
        width: 52,
        height: 52,
        borderRadius: "50%",
        margin: "0 auto 14px",
        display: "block",
        objectFit: "cover",
    },
    wTitle: {
        fontSize: 20,
        fontWeight: 700,
        textAlign: "center",
        margin: "0 0 4px",
        color: "#111",
    },
    badge: {
        textAlign: "center",
        fontSize: 12,
        background: "#f5f5f5",
        borderRadius: 20,
        padding: "4px 12px",
        margin: "0 auto 16px",
        width: "fit-content",
        display: "block",
    },
    section: { marginBottom: 12 },
    sLabel: { fontSize: 11, color: "#aaa", margin: "0 0 4px", fontWeight: 600 },
    mono: {
        background: "#f5f5f5",
        borderRadius: 6,
        padding: "8px 10px",
        fontSize: 11,
        color: "#555",
        wordBreak: "break-all",
        fontFamily: "monospace",
        whiteSpace: "pre-wrap",
    },
    serverBox: {
        background: "#f0fff4",
        border: "1px solid #d4edda",
        borderRadius: 8,
        padding: "12px",
        marginBottom: 14,
    },
    codeBox: {
        background: "#1e1e1e",
        borderRadius: 10,
        padding: "14px",
        marginTop: 4,
    },
    codeTitle: {
        color: "#aaa",
        fontSize: 11,
        margin: "0 0 8px",
        fontWeight: 600,
    },
    code: {
        color: "#9cdcfe",
        fontSize: 11,
        margin: 0,
        whiteSpace: "pre-wrap",
        fontFamily: "monospace",
        lineHeight: 1.6,
    },
};
