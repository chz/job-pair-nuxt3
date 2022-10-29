import { defineStore } from 'pinia'
import { useRouter, useRoute } from 'vue-router'
import { getAuth, onAuthStateChanged } from "firebase/auth"
export default function setup() {
    const { $emitter, $bootstrap, $alert } = useNuxtApp()
    const router = useRouter()
    const route = useRoute()
    const axiosComposable = useAxios()
    const state = reactive({
        ui: null,
        unsubscribe: null,
        isSent: false,
        authResult: null,
        countdownInterval: null,
        cdDefault: 120,
        cdVisible: 0,
    })
    async function handleAuthResult(authResult, type) {
        state.authResult = authResult
        const basicInfo = getBasicInfo(type)
        if (!basicInfo.email) {
            await $alert('請使用其他方式登入')
            return
        }
        if (basicInfo.emailVerified) {
            signIn(basicInfo)
        } else {
            sendEmailLink(type)
        }
    }
    async function signIn(user) {
        const auth = getAuth()
        if (!auth || !auth.currentUser) {
            return
        }
        // this.setUser(user) // 這行附加會造成某些程式碼被跳過
        const idToken = await auth.currentUser.getIdToken()
        console.log({
            idToken
        })
        axiosComposable.setToken(idToken)
        const signInResult = await this.postSignin(idToken)
        if (!signInResult) {
            // 避免人求職者與人資Mixin，重複打API
            return
        }
        if (signInResult.status !== 200) {
            // 任何錯誤導回首頁
            this.$router.replace({
                name: 'home'
            })
            return
        }
        /**
         * 求職者
         * 人資已註冊完成
         * 人資尚未註冊完成
         * 其他狀況
         */
        const { employee = false, admin = false, company = false } = signInResult.data
        if (employee) {
            // 代表已經完整註冊過會員
            Object.assign(user, employee)
            await this.getJobRecommended()
            await this.getUserJobs({
                userId: user.id,
            })
            this.setUser(user)
            $emitter.emit("hideUserModal")
            $emitter.emit('hideCompanyModal')
            if (this.$route.path.includes('admin') || this.$route.name === 'home') {
                this.$router.push({
                    name: 'jobs'
                })
            }
            return
        }
        if (admin) {
            user.type = "admin"
            Object.assign(user, admin)
            this.setUser(user)
            if (company) {
                $emitter.emit("setMenuType", 'admin')
                // 有取得公司資料代表已完成註冊人資
                const organizationId = company.id
                if (organizationId) {
                    const jobsResponse = await this.getCompanyJobs({
                        organizationId,
                        status: ['active'],
                    })
                    const { data = [] } = jobsResponse
                    company.hasActiveJobs = !!data.length
                }
                this.setCompany(company)
                const whiteList = ['admin', 'about', 'pending', 'job']
                const isNotPermitted = whiteList.every(word => {
                    return !this.$route.path.includes(word)
                })
                if (isNotPermitted) {
                    this.$router.push({
                        name: 'admin'
                    })
                }
            } else {
                // 未完成註冊人資導向到公司註冊畫面
                this.$router.push({
                    name: 'companyRegister'
                })
            }
            $emitter.emit("hideUserModal")
            $emitter.emit('hideCompanyModal')
            return
        }
        // 判斷是否為註冊到一半的求職者
        const userString = localStorage.getItem("user")
        const tempUser = JSON.parse(userString)
        if (!user.id && userString && tempUser.preference) {
            // 五題已經作答回最後一步驟，反之回去作答
            const questionKeys = ["partner", "variety", "env", "phase", "manage"]
            const answeredList = Object.keys(tempUser.preference)
            const allAnswered = questionKeys.every((question) => {
                return answeredList.includes(question)
            })
            if (allAnswered) {
                this.$router.push({
                    name: "userRegister",
                })
            } else {
                this.$router.push({
                    name: "questions",
                })
            }
            user.type = "employee"
            this.setUser(user)
            $emitter.emit("hideUserModal")
            $emitter.emit('hideCompanyModal')
            return
        }
        // 各種未完成註冊的用戶
        if (this.$route.path.includes('admin')) {
            // 導向到公司註冊畫面
            user.type = "admin"
            this.$router.push({
                name: 'companyRegister'
            })
        } else {
            user.type = "employee"
            this.$router.push({
                name: "questions",
            })
        }
        this.setUser(user)
        $emitter.emit("hideUserModal")
        $emitter.emit('hideCompanyModal')
    }
    function getBasicInfo(type) {
        const user = state.authResult.user
        const { displayName, email, uid, phoneNumber, photoURL, emailVerified } = user
        const basicInfo = {
            name: displayName,
            email,
            uid,
            telephone: phoneNumber,
            image: photoURL,
            type,
            emailVerified,
        }
        return basicInfo
    }
    async function sendEmailLink(type) {
        const basicInfo = getBasicInfo(type)
        return
        const response = await this.postVerificationEmail(basicInfo)
        if (response.status !== 200) {
            return false
        }
        this.countdownInterval = true
        this.cdVisible = this.cdDefault
        this.countdownInterval = setInterval(() => {
            this.cdVisible -= 1
            if (this.cdVisible < 1) {
                clearInterval(this.countdownInterval)
                this.countdownInterval = null
            }
        }, 1000)
        this.isSent = true
    }
    return {
        state,
        signIn,
        handleAuthResult,
        sendEmailLink
    }
}
// export default defineStore('login', {
//     state: () => ({
//     }),
//     // getters: {
//     //     getCount: (state) => state.count,
//     // },
//     actions: {
//         listenToAuthState() {
//             //   this.count++
//             const firebaseAuth = getAuth()
//             this.unsubscribe = onAuthStateChanged(firebaseAuth, async (userInfo) => {
//                 if (!userInfo) {
//                     // 造成登入機制無法連貫
//                     if (this.user && this.user.uid) {
//                         // 判斷為從登入變成登出
//                         this.userSignout()
//                         if (this.$route.path.includes('admin')) {
//                             this.$router.push({
//                                 name: 'admin',
//                             })
//                         } else {
//                             this.$router.push({
//                                 name: 'home',
//                             })
//                         }
//                     }
//                     return
//                 }
//                 if (!userInfo.emailVerified) {
//                     return
//                 }
//                 const { uid, displayName, email, photoURL, phoneNumber } = userInfo
//                 const user = {
//                     uid,
//                     name: displayName,
//                     email,
//                     image: photoURL,
//                     telephone: phoneNumber,
//                 }
//                 this.$toggleLoader(true)
//                 await this.signIn(user)
//                 this.$toggleLoader(false)
//             })
//         },
//         async signIn(user) {
//             const auth = getAuth()
//             if (!auth || !auth.currentUser) {
//                 return
//             }
//             // this.setUser(user) // 這行附加會造成某些程式碼被跳過
//             const idToken = await auth.currentUser.getIdToken()
//             this.setToken(idToken)
//             const signInResult = await this.postSignin(idToken)
//             if (!signInResult) {
//                 // 避免人求職者與人資Mixin，重複打API
//                 return
//             }
//             if (signInResult.status !== 200) {
//                 // 任何錯誤導回首頁
//                 this.$router.replace({
//                     name: 'home'
//                 })
//                 return
//             }
//             /**
//              * 求職者
//              * 人資已註冊完成
//              * 人資尚未註冊完成
//              * 其他狀況
//              */
//             const { employee = false, admin = false, company = false } = signInResult.data
//             if (employee) {
//                 // 代表已經完整註冊過會員
//                 Object.assign(user, employee)
//                 await this.getJobRecommended()
//                 await this.getUserJobs({
//                     userId: user.id,
//                 })
//                 this.setUser(user)
//                 $emitter.emit("hideUserModal")
//                 $emitter.emit('hideCompanyModal')
//                 if (this.$route.path.includes('admin') || this.$route.name === 'home') {
//                     this.$router.push({
//                         name: 'jobs'
//                     })
//                 }
//                 return
//             }
//             if (admin) {
//                 user.type = "admin"
//                 Object.assign(user, admin)
//                 this.setUser(user)
//                 if (company) {
//                     $emitter.emit("setMenuType", 'admin')
//                     // 有取得公司資料代表已完成註冊人資
//                     const organizationId = company.id
//                     if (organizationId) {
//                         const jobsResponse = await this.getCompanyJobs({
//                             organizationId,
//                             status: ['active'],
//                         })
//                         const { data = [] } = jobsResponse
//                         company.hasActiveJobs = !!data.length
//                     }
//                     this.setCompany(company)
//                     const whiteList = ['admin', 'about', 'pending', 'job']
//                     const isNotPermitted = whiteList.every(word => {
//                         return !this.$route.path.includes(word)
//                     })
//                     if (isNotPermitted) {
//                         this.$router.push({
//                             name: 'admin'
//                         })
//                     }
//                 } else {
//                     // 未完成註冊人資導向到公司註冊畫面
//                     this.$router.push({
//                         name: 'companyRegister'
//                     })
//                 }
//                 $emitter.emit("hideUserModal")
//                 $emitter.emit('hideCompanyModal')
//                 return
//             }
//             // 判斷是否為註冊到一半的求職者
//             const userString = localStorage.getItem("user")
//             const tempUser = JSON.parse(userString)
//             if (!user.id && userString && tempUser.preference) {
//                 // 五題已經作答回最後一步驟，反之回去作答
//                 const questionKeys = ["partner", "variety", "env", "phase", "manage"]
//                 const answeredList = Object.keys(tempUser.preference)
//                 const allAnswered = questionKeys.every((question) => {
//                     return answeredList.includes(question)
//                 })
//                 if (allAnswered) {
//                     this.$router.push({
//                         name: "userRegister",
//                     })
//                 } else {
//                     this.$router.push({
//                         name: "questions",
//                     })
//                 }
//                 user.type = "employee"
//                 this.setUser(user)
//                 $emitter.emit("hideUserModal")
//                 $emitter.emit('hideCompanyModal')
//                 return
//             }
//             // 各種未完成註冊的用戶
//             if (this.$route.path.includes('admin')) {
//                 // 導向到公司註冊畫面
//                 user.type = "admin"
//                 this.$router.push({
//                     name: 'companyRegister'
//                 })
//             } else {
//                 user.type = "employee"
//                 this.$router.push({
//                     name: "questions",
//                 })
//             }
//             this.setUser(user)
//             $emitter.emit("hideUserModal")
//             $emitter.emit('hideCompanyModal')
//         },
//         async handleAuthResult(authResult, type) {
//             this.authResult = authResult
//             const basicInfo = this.getBasicInfo(type)
//             if (!basicInfo.email) {
//                 await this.$alert('請使用其他方式登入')
//                 return
//             }
//             if (basicInfo.emailVerified) {
//                 this.signIn(basicInfo)
//             } else {
//                 this.sendEmailLink(type)
//             }
//         },
//         getBasicInfo(type) {
//             const user = this.authResult.user
//             const { displayName, email, uid, phoneNumber, photoURL, emailVerified } = user
//             const basicInfo = {
//                 name: displayName,
//                 email,
//                 uid,
//                 telephone: phoneNumber,
//                 image: photoURL,
//                 type,
//                 emailVerified,
//             }
//             return basicInfo
//         },
//         async sendEmailLink(type) {
//             const basicInfo = this.getBasicInfo(type)
//             const response = await this.postVerificationEmail(basicInfo)
//             if (response.status !== 200) {
//                 return false
//             }
//             this.countdownInterval = true
//             this.cdVisible = this.cdDefault
//             this.countdownInterval = setInterval(() => {
//                 this.cdVisible -= 1
//                 if (this.cdVisible < 1) {
//                     clearInterval(this.countdownInterval)
//                     this.countdownInterval = null
//                 }
//             }, 1000)
//             this.isSent = true
//         },
//     },
// })