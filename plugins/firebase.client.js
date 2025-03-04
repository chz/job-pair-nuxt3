import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
export default defineNuxtPlugin(() => {
    // Create App
    let firebaseConfig = {
        apiKey: "AIzaSyBXP_LIxi5mOtbwaueWFRArAfinuK7XgTc",
        authDomain: "job-pair-taiwan-prd.firebaseapp.com",
        projectId: "job-pair-taiwan-prd",
        storageBucket: "job-pair-taiwan-prd.appspot.com",
        messagingSenderId: "539306285865",
        appId: "1:539306285865:web:bb7589ad6fcafdd7a63538",
        measurementId: "G-80H8KDK7FK"
    }
    const app = initializeApp(firebaseConfig)
    try {
        getAnalytics(app)
    } catch (error) {
        console.log(error.message);
    }
    return {
        provide: {
            storageBucket: firebaseConfig.storageBucket
        }
    }
})
