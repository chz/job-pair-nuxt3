<template>
    <div class="inputGroup" :ref="`inputGroup`" :class="{ 'inputGroup--error': message }">
        <div class="inputGroup__nameGroup">
            <span v-if="required" class="text-danger">*</span>
            {{ name }}
            <!-- <span class="inputGroup__message">{{ message }}</span> -->
        </div>
        <label class="inputGroup__label" :class="{ 'inputGroup__label--disabled': disabled }">
            <input v-if="!disabled" class="label__input" v-model="localValue" :placeholder="placeholder" type="password"
                autocomplete="off" />
            <input v-else :disabled="true" class="label__input" :class="{ 'label__input--disabled': disabled }"
                :value="localValue" :readonly="modelValue" />
        </label>
    </div>
</template>
<script>
/**
 * The prototype of all the other inputs,
 * read these codes thoroughly makes it easy to read other inputs.
 */
export default {
    name: 'pass',
    data: function () {
        return {
            message: "",
        }
    },
    props: {
        name: {
            type: String,
            default: "",
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
        types: {
            type: Array,
            default: () => {
                return [] // 需要限制時使用'english', 'number', 'symbol'
            },
        },
    },
    computed: {
        localValue: {
            get() {
                return this.modelValue
            },
            set(newValue) {
                this.$emit("update:modelValue", newValue)
            },
        },
    },
    watch: {
        disabled() {
            this.message = ""
        },
    },
    methods: {
        checkIsEnglish(character) {
            const regex = /^[a-zA-Z \-',]+$/
            return regex.test(character)
        },
        checkIsNumeric(character) {
            const regex = /^[0-9]+$/
            return regex.test(character)
        },
        checkIsSymbol(character) {
            const regex = /[-!$%^&*()_+|~=`{}[\]:";'<>?,./]/
            return regex.test(character)
        },
    },
}
</script>
<style lang="scss" scoped>
@import './inputGroup.scss';
</style>