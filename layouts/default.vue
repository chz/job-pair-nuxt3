<template>
    <div id="app" class="app w-100">
        <SeoKit />
        <!-- <OgImageScreenshot /> -->
        <!-- <OgImageStatic /> -->
        <LazyOrganismHeader />
        <div class="main">
            <slot>
            </slot>
        </div>
        <LazyOrganismFooter />
        <!-- 如果條件渲染有異步渲染問題 -->
        <OrganismUserModal></OrganismUserModal>
        <OrganismCompanyModal></OrganismCompanyModal>
        <OrganismSwitchModal></OrganismSwitchModal>
    </div>
</template>
<script setup>
// const { $liff, } = useNuxtApp()
const repoSelect = useRepoSelect()
const runTimeConfig = useRuntimeConfig()
onMounted(async () => {
    if (process.client) {
        await Promise.all([
            repoSelect.getSelectByQuery(),
            repoSelect.getLocation(),
            repoSelect.getIndustryCategory(),
            repoSelect.getQuestions(),
        ])
    }
})
useSchemaOrg([
    defineOrganization({
        name: 'Job Pair',
        logo: 'https://storage.googleapis.com/public.prd.job-pair.com/meta/logo.png',
        sameAs: [
            'https://www.facebook.com/jobpairtw/'
        ]
    }),
])
// async function startLiff() {
//     // 调用 console 方法输出日志
//     if ($liff && process.env.VITE_APP_FIREBASE_ENV !== 'production') {
//         try {
//             await $liff.init({ liffId: config.public.LIFF_ID })
//         } catch (error) {
//             console.log(error.message || error);
//         }
//         const profile = await $liff.getProfile()
//         console.log({
//             profile
//         });
//         state.profile = profile
//         window.open(`https://line.me/R/oaMEssage/@428awwlj/?測試訊息`)
//         // const getProfileExample = {
//         //     "userId": "U4af4980629...",
//         //     "displayName": "Brown",
//         //     "pictureUrl": "https://profile.line-scdn.net/abcdefghijklmn",
//         //     "statusMessage": "Hello, LINE!"
//         // }
//         if (profile) {
//             const { userId = '' } = profile
//             console.log({
//                 userId
//             });
//         }
//     }
// }
</script>
<style lang="scss">
.app {
    // https://web.dev/font-display/
    font-display: swap;
    font-family: 'Noto Sans TC', sans-serif, 'charter', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif';
    background-color: #ecf3f6;
    overflow-x: hidden;
}

.main {
    min-height: calc(100vh - 200px);
}

body {
    // https://codepen.io/ckeditor/pen/VqXYQq
    /* We need to assaign this CSS Custom property to the body instead of :root, because of CSS Specificity and codepen stylesheet placement before loaded CKE5 content. */
    --ck-z-default: 100;
    --ck-z-modal: calc(var(--ck-z-default) + 900);
}

// https://ckeditor.com/docs/ckeditor5/latest/support/licensing/managing-ckeditor-logo.html
.ck.ck-balloon-panel.ck-powered-by-balloon {
    --ck-powered-by-border-color: #d3d3d3;
}
</style>