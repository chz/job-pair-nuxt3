<template>
    <div class="event">
        <template v-if="!state.isFailed">
            <div class="event__frame">
                <img class="frame__image" alt="成功" src="@/assets/event/img_報名成功.svg">
                <h1 class="frame__title">活動報名完成</h1>
                <div class="frame__textarea">
                    <div>
                        活動名稱：{{ state.event.name }}
                    </div>
                    <div>
                        開始時間：{{ $filter.time(state.event.startDate) }}
                    </div>
                    <div>
                        結束時間：{{ $filter.time(state.event.endDate) }}
                    </div>
                    <div>
                        地點：{{ state.event.location }}
                    </div>
                    <div>
                        報名日期：<span id="signUpDate"></span>
                    </div>
                </div>
            </div>
            <LazyAtomBtnSimple class="event__button" @click="printPage()">
                儲存頁面
            </LazyAtomBtnSimple>
        </template>
        <template v-else>
            <div class="event__frame">
                <img class="frame__image" alt="失敗" src="@/assets/event/img_報名失敗.svg">
                <h1 class="frame__title">活動報名失敗</h1>
                <div class="frame__textarea">
                    {{ state.statusText }}
                </div>
            </div>
            <LazyAtomBtnSimple class="event__button" @click="signUp()">
                再報名一次
            </LazyAtomBtnSimple>
        </template>
    </div>
</template>
<script setup>
const { $filter, $emitter, $sweet, } = useNuxtApp()
const repoEvent = useRepoEvent()
const repoAuth = useRepoAuth()
const route = useRoute()
const chunks = route.params.idcontributor.split('&&')
const eventId = chunks[0]
const contributor = chunks[1]
const runTimeConfig = useRuntimeConfig()
// For seo purposes
const { data: event } = await useFetch(`${runTimeConfig.public.apiBase}/event/${eventId}`,)
const state = reactive({
    signUpDate: null,
    isFailed: false,
    statusText: '請確認網路連線狀況',
    event,
    eventId,
    contributor,
})
useSeoMeta({
    title: () => `${state.event.name}`,
    ogTitle: () => `${state.event.name}`,
})
onMounted(() => {
    const eventItemString = sessionStorage.getItem('event')
    if (eventItemString) {
        const eventItem = JSON.parse(eventItemString)
        repoEvent.state.eventId = eventItem.eventId
        repoEvent.state.contributor = eventItem.contributor
    }
})
watch(() => repoAuth.state.user, (newValue, oldValue) => {
    if (process.client) {
        // 未登入前紀錄Flag，登入後自動報名活動
        if (route.params?.idcontributor) {
            const chunks = route.params.idcontributor.split('&&')
            const eventId = chunks[0]
            const contributor = chunks[1]
            // 給未註冊過的用戶註冊事件使用
            repoEvent.state.eventId = eventId
            repoEvent.state.contributor = contributor
            // 給未註冊過的用戶註冊事件使用
            sessionStorage.setItem('event', JSON.stringify({
                eventId,
                contributor,
            }))
            if (newValue?.id && oldValue === null) {
                signUp(eventId)
            }
        }
    }
    if (process.client && !newValue) {
        requestSelector('#userModal', () => {
            $emitter.emit("showUserModal")
        })
    }
}, { immediate: true })
function requestSelector(selectorString, callback,) {
    let localCount = 0
    function step() {
        if (localCount >= 100) {
            console.error(`Cannot find element ${selectorString}`)
            return
        }
        const queryResult = document.querySelector(selectorString)
        const hasEvent = $emitter.all.has('showUserModal')
        if (queryResult && hasEvent) {
            callback(queryResult)
        } else {
            localCount++
            window.requestAnimationFrame(step)
        }
    }
    step()
}
async function signUp() {
    $sweet.loader(true)
    const response = await repoEvent.postEventRegistration({
        eventId: repoEvent.state.eventId,
        contributor: repoEvent.state.contributor
    })
    $sweet.loader(false)
    state.isFailed = false
    if (response.status !== 200) {
        state.isFailed = true
        return
    }
    // 關閉彈窗
    if (response.data) {
        setTimeout(() => {
            $emitter.emit("hideUserModal")
        }, 150) // 300ms animation - server response 150ms
    }
    if (typeof response.data === 'string') {
        state.isFailed = true
        state.statusText = response.data
    }
    if (!state.isFailed) {
        const { signUpDate = '' } = response.data
        state.signUpDate = signUpDate
        const element = document.querySelector('#signUpDate')
        element.innerHTML = $filter.time(signUpDate)
    }
}
async function printPage() {
    window.print()
}
</script>
<style lang="scss">
.event {
    padding-top: 250px;
    padding-bottom: 80px;

    .event__frame {
        padding: 40px 20px 20px;
        border-radius: 10px;
        border: solid 1px #5b2714;
        background-color: #fff;
        position: relative;
        max-width: 324px;
        margin: auto;

        .frame__image {
            position: absolute;
            top: 0;
            left: 50%;
            transform: translate(-50%, -90%);
        }

        .frame__title {
            font-size: 24px;
            font-weight: bold;
            font-stretch: normal;
            font-style: normal;
            line-height: 1.5;
            letter-spacing: normal;
            text-align: center;
            color: #332b00;
            border-bottom: 4px solid #ffd600;
            width: 144px;
            margin: auto;
            white-space: nowrap;
        }

        .frame__textarea {
            margin-top: 20px;
            font-size: 16px;
            font-weight: normal;
            font-stretch: normal;
            font-style: normal;
            line-height: 1.5;
            letter-spacing: normal;
            text-align: left;
            color: #332b00;
        }
    }

    .event__button {
        max-width: 232px;
        padding: 9px 80px 8px;
        border-radius: 5px;
        background-color: #5ea88e;
        margin: auto;
        margin-top: 30px;
    }
}
</style>