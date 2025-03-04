<template>
    <div class="inputGroup" :ref="`inputGroup`" :key="state.key">
        <div class="inputGroup__nameGroup">
            <span v-if="required" class="text-danger">*</span>
            {{ name }}
        </div>
        <label class="inputGroup__label" :class="{ 'inputGroup__label--disabled': disabled }">
            <input :id="id" v-if="!disabled" class="label__input" v-model="localValue" :placeholder="localPlaceholder"
                :data-required="required" :data-name="name" autocomplete="off" @blur="handleValidate($event)"
                @keyup.enter="emit('keyup.enter', $event)" />
            <input v-else :id="id" :disabled="true" class="label__input" :class="{ 'label__input--disabled': disabled }"
                :value="localValue" :readonly="modelValue" />
        </label>
    </div>
</template>
<script >
export default {
    name: 'customText',
}
</script>
<script setup>
const { $uuid4, } = useNuxtApp()
const emit = defineEmits(['update:modelValue', 'keyup.enter'])
const state = reactive({
    key: null,
    message: '',
    isValid: true,
})
const props = defineProps({
    id: {
        type: String,
        default: undefined,
    },
    name: {
        type: String,
        default: "",
    },
    types: {
        type: Array,
        default: function () {
            return ['english', 'mandarin', 'number', 'marks']
        }
    },
    width: {
        type: [String, Number],
        default: "1",
    },
    modelValue: {
        type: [String, Number],
        default: "",
    },
    required: {
        type: Boolean,
        default: false,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    placeholder: {
        type: String,
        default: "",
    },
    min: {
        type: Number,
        default: 0,
    },
    max: {
        type: Number,
        default: 0,
    },
    validate: {
        type: Function,
    }
})
onMounted(() => {
    state.key = $uuid4()
})
const localPlaceholder = computed(() => {
    if (props.placeholder) {
        return props.placeholder
    }
    if (props.name) {
        return `請輸入${props.name}`
    }
    return props.placeholder
})
const localValue = computed({
    get() {
        return props.modelValue
    },
    set(newValue) {
        emit("update:modelValue", newValue)
    },
})
watch(() => localValue.value, () => {
    if (props.max && localValue.value && localValue.value.length > props.max) {
        localValue.value = localValue.value.slice(0, props.max)
    }
})
// methods
function setErrorMessage(message = '') {
    state.message = message
    state.isValid = !message
}
function handleValidate() {
    setErrorMessage()
    const inputValue = localValue.value
    if (props.required && !inputValue.trim()) {
        setErrorMessage('欄位為必填')
        return
    }
    // custom validation
    if (props.validate) {
        const message = props.validate(inputValue)
        if (message) {
            setErrorMessage(message)
        }
    }
    // 欄位長度
    if (props.byteSize) {
        const byteSize = new Blob([inputValue]).size
        if (byteSize > props.byteSize) {
            setErrorMessage('內容長度超出限制')
        }
    }
    // regex
    const regexMessage = validateDefaultRegex(inputValue)
    if (regexMessage) {
        setErrorMessage(regexMessage)
    }
    return true
}
function validateDefaultRegex() {
    let regexCode = 0
    if (props.types.includes('mandarin')) {

        regexCode += 1
    }
    if (props.types.includes('english')) {
        regexCode += 2
    }
    if (props.types.includes('number')) {
        regexCode += 4
    }
    if (props.types.includes('marks')) {
        regexCode += 8
    }
    let regexMessage = null
    let regex = null
    switch (regexCode) {
        case 1: {
            regexMessage = '限輸入中文'
            regex = /[^\u3400-\uFA29]/
            break;
        }
        case 2: {
            regexMessage = '限輸入英文'
            regex = /[^a-zA-Z]/
            break;
        }
        case 3: {
            regexMessage = '限輸入中英文'
            regex = /[^\u3400-\uFA29a-zA-Z]/
            break;
        }
        case 4: {
            regexMessage = '限輸入數字'
            regex = /[^\u3400-\uFA29\d]/
            break;
        }
        case 5: {
            regexMessage = '限輸入中數字'
            regex = /[^\u3400-\uFA29\d]/
            break;
        }
        case 6: {
            regexMessage = '限輸入英數字'
            regex = /[^a-zA-Z\d]/
            break;
        }
        case 7: {
            regexMessage = '限輸入中英數字'
            regex = /[^\u3400-\uFA29a-zA-Z\d]/
            break;
        }
        default: {
            // 不加任何限制
            break;
        }
    }
    if (regex?.test(inputValue)) {
        return regexMessage
    }
}
</script>
<style lang="scss" scoped>
@import './inputGroup.scss';
</style>