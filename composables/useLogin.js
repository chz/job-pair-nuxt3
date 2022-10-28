import { reactive, onMounted, onUnmounted, watch, nextTick, computed, ref, watchEffect } from 'vue'
import { getAuth, } from "firebase/auth"
export default function () {
    const state = reactive({
        ui: null,
        unsubscribe: null,
        isSent: false,
        authResult: null,
        countdownInterval: null,
        cdDefault: 120,
        cdVisible: 0,
    })
    onUnmounted(() => {
        if (state.unsubscribe) {
            state.unsubscribe()
        }
    })
    function listenToAuthState() {
        const firebaseAuth = getAuth()
        state.unsubscribe = firebaseAuth.onAuthStateChanged(async (userInfo) => {
            if (!userInfo) {
                // 造成登入機制無法連貫
                if (this.user && this.user.uid) {
                    // 判斷為從登入變成登出
                    // this.userSignout()
                    if (this.$route.path.includes('admin')) {
                        this.$router.push({
                            name: 'admin',
                        })
                    } else {
                        this.$router.push({
                            name: 'home',
                        })
                    }
                }
                return
            }
            if (!userInfo.emailVerified) {
                return
            }
            const { uid, displayName, email, photoURL, phoneNumber } = userInfo
            const user = {
                uid,
                name: displayName,
                email,
                image: photoURL,
                telephone: phoneNumber,
            }
            await this.signIn(user)
        })
    }
    async function signIn(user) {
        const firebaseAuth = getAuth()
        if (!firebaseAuth || !firebaseAuth.currentUser) {
            return
        }
        // this.setUser(user) // 這行附加會造成某些程式碼被跳過
        const idToken = await firebaseAuth.currentUser.getIdToken()
        this.setToken(idToken)
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
            this.$emitter.emit("hideUserModal")
            this.$emitter.emit('hideCompanyModal')
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
                this.$emitter.emit("setMenuType", 'admin')
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
            this.$emitter.emit("hideUserModal")
            this.$emitter.emit('hideCompanyModal')
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
            this.$emitter.emit("hideUserModal")
            this.$emitter.emit('hideCompanyModal')
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
        this.$emitter.emit("hideUserModal")
        this.$emitter.emit('hideCompanyModal')
    }
    async function handleAuthResult(authResult, type) {
        // Todo
        // const { credential = {} } = authResult
        // const { accessToken, idToken } = credential
        this.authResult = authResult
        const basicInfo = this.getBasicInfo(type)
        if (!basicInfo.email) {
            await this.$alert('請使用其他方式登入')
            return
        }
        if (basicInfo.emailVerified) {
            this.signIn(basicInfo)
        } else {
            this.sendEmailLink(type)
        }
    }
    function getBasicInfo(type) {
        const user = this.authResult.user
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

}