<template>
    <div class="container accountManagement">
        <template v-if="state.tempUser">
            <div class="accountManagement__card">
                <div class="card__headerGroup">
                    <h4>帳號資訊</h4>
                    <LazyOrganismDeleteModal class="managemement__others"></LazyOrganismDeleteModal>
                </div>
                <div class="accountManagement__form">
                    <LazyAtomInputText v-model="state.tempUser.name" name="聯絡人姓名" required class="mb-3">
                    </LazyAtomInputText>
                    <div class="mb-1"><span class="text-danger">*</span> 聯絡人電子郵件</div>
                    <LazyAtomInputText v-model="state.tempUser.email" :disabled="true" class="mb-3"></LazyAtomInputText>
                    <!-- <template v-if="!toggleChangePassword">
                        <form>
                            <div class="mb-1">密碼變更</div>
                            <div class="form__password__inputGroup mb-3">
                                <InputPass v-model="pass" placeholder="若要變更密碼，請先輸入原有密碼" class="inputGroup__text">
                                </InputPass>
                                <button class="inputGroup__button" @click.prevent="handleCredential()">修改密碼</button>
                            </div>
                        </form>
                    </template>
                    <template v-if="toggleChangePassword">
                        <form>
                            <div class="mb-1"><span class="text-danger">*</span> 新密碼</div>
                            <InputPass v-model="newPass" placeholder="請輸入新密碼(至少含一個英文字母與數字)" class="inputGroup__text">
                            </InputPass>
                            <InputPass v-model="newPassAgain" placeholder="請重新輸入新密碼(至少含一個英文字母與數字)" class="inputGroup__text">
                            </InputPass>
                            <button class="form__confirm" @click.prevent="submitNewPass()">更新密碼</button>
                        </form>
                    </template> -->
                    <button class="btn btn-danger" @click="logout()">登出</button>
                </div>
            </div>
            <!-- <div class="accountManagement__card mt-4">
                <h4>錢包餘額</h4>
                <div class="balance__inputGroup">
                    <LazyAtomInputNumber class="inputGroup__input" v-model="state.balance" disabled></LazyAtomInputNumber>
                    <LazyAtomBtnSimple class="inputGroup__btn" type="button">我要儲值</LazyAtomBtnSimple>
                </div>
                <div class="card__header">使用紀錄</div>
                <table class="table  table-striped ballance__table">
                    <thead>
                        <tr>
                            <th scope="col">職缺名稱</th>
                            <th scope="col">開啟職缺期間</th>
                            <th scope="col">天數</th>
                            <th scope="col">點數</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <th scope="row">
                                <div class="table__cell">
                                    Java工程師
                                </div>
                            </th>
                            <td>
                                <div class="table__cell">
                                    2023/01/04 ~ 2023/02/10
                                </div>
                            </td>
                            <td>
                                <div class="table__cell">
                                    2 週 3 日，共 17 天
                                </div>
                            </td>
                            <td>
                                <div class="table__cell">
                                    17 點
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <div class="table__cell">
                                    Java工程師
                                </div>
                            </th>
                            <td>
                                <div class="table__cell">
                                    2023/01/04 ~ 2023/02/10
                                </div>
                            </td>
                            <td>
                                <div class="table__cell">
                                    2 週 3 日，共 17 天
                                </div>
                            </td>
                            <td>
                                <div class="table__cell">
                                    17 點
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row">
                                <div class="table__cell">
                                    Java工程師
                                </div>
                            </th>
                            <td>
                                <div class="table__cell">
                                    2023/01/04 ~ 2023/02/10
                                </div>
                            </td>
                            <td>
                                <div class="table__cell">
                                    2 週 3 日，共 17 天
                                </div>
                            </td>
                            <td>
                                <div class="table__cell">
                                    17 點
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div> -->
            <!-- <div class="accountManagement__card mt-3">
            <h4>人資聊天室</h4>
            <section class="accountManagement__chat">
                <LazyAtomInputText v-model="tempUser.chatName" name="聊天室暱稱" class="mb-3" required></LazyAtomInputText>
                <div class="chat__image" ref="svgContainer" v-html="chatIcon"></div>
            </section>
        </div> -->
            <!-- <div class="d-flex justify-content-center">
                <button class="form__confirm" @click.prevent="submitProfile()">儲存</button>
            </div> -->
        </template>
    </div>
</template>
<script setup>
import { getAuth, } from "firebase/auth"
const { $sweet, } = useNuxtApp()
const runTimeConfig = useRuntimeConfig()
const repoAuth = useRepoAuth()
const router = useRouter()
const repoAdmin = useRepoAdmin()
const state = reactive({
    tempUser: null,
    pass: null,
    toggleChangePassword: false,
    newPass: null,
    newPassAgain: null,
    chatIcon: null,
    balance: 0,
})
// hooks
useHead({
    title: '帳戶管理 - 招募中心'
})
watch(() => repoAuth.state.user, (newValue) => {
    if (!newValue) {
        return
    }
    state.tempUser = JSON.parse(JSON.stringify(newValue))
    if (!state.tempUser.chatName) {
        const uuid = uuid4()
        state.tempUser.chatName = `匿名${uuid.slice(0, 4)}`
    }
}, { immediate: true })
// methods
async function logout() {
    localStorage.removeItem("user")
    await repoAuth.userSignout()
    let user = null
    try {
        const auth = getAuth()
        user = auth().currentUser
    } finally {
        if (!user) {
            router.push({
                name: "admin",
            })
        }
    }
}
async function handleCredential() {
    const auth = getAuth()
    const user = auth().currentUser
    const credential = auth.EmailAuthProvider.credential(user.email, state.pass)
    try {
        const authResult = await user.reauthenticateWithCredential(credential)
        if (authResult.user.refreshToken) {
            // 驗證成功，允許變更密碼
            state.pass = null
            state.toggleChangePassword = true
        }
    } catch (error) {
        // 驗證失敗
        $sweet.alert(error.message)
    }
}
async function submitNewPass() {
    if (state.newPass !== state.newPassAgain) {
        $sweet.alert("密碼不一致")
        return
    }
    const user = firebase.auth().currentUser
    try {
        const res = await user.updatePassword(state.newPass)
        state.newPass = null
        state.newPassAgain = null
        state.toggleChangePassword = false
        $sweet.succeed({
            text: '修改密碼完成',
        })
    } catch (error) {
        // 更新失敗
        $sweet.alert(error.message)
    }
}
async function submitProfile() {
    const auth = getAuth()
    const user = auth().currentUser
    try {
        await user.updateProfile({
            name: state.tempUser.name,
        })
        const response = await repoAdmin.patchAdmin(state.tempUser)
        if (response.status === 200) {
            repoAuth.setUser(state.tempUser)
            $sweet.succeed()
        }
    } catch (error) {
        // 更新失敗
        $sweet.alert(error.message)
    }
}
</script>
<style lang="scss" scoped>
.accountManagement {
    .accountManagement__card {
        background-color: #fafafa;
        padding: 23px 40px;
        border-radius: 10px;

        .card__headerGroup {
            display: flex;
            gap: 8px;
        }

        .card__header {
            margin-top: 52px;
            font-weight: bold;
        }
    }

    .accountManagement__form {
        max-width: 476px;

        .form__password__inputGroup {
            display: flex;
            align-items: center;

            .inputGroup__text {
                margin-right: 24px;
            }

            .inputGroup__button {
                color: #29b0ab;
                background-color: rgba(0, 0, 0, 0);
                border: none;
                white-space: nowrap;
            }
        }

    }

    .balance__inputGroup {
        display: flex;
        gap: 5px;

        .inputGroup__input {
            width: 131px;
        }

        .inputGroup__btn {
            width: 112px;
            height: 42px;
            border-radius: 10px;
        }
    }

    .ballance__table {
        border-top: 1px solid #d3d3d3;
        margin-top: 8px;
        font-weight: normal;

        .table__cell {
            padding: 24px 0;
        }
    }

    .form__confirm {
        width: 105px;
        height: 48px;
        background: #29b0ab;
        border: none;
        color: white;
        border-radius: 10px;
        margin-top: 32px;
    }
}
</style>