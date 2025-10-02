import React from "react"
import { Form } from "antd"
import TextField from "@mui/material/TextField"
import type { TextFieldProps } from "@mui/material/TextField"

type DiscountFieldProps = Omit<TextFieldProps, "name"> & {
  name: any // 👈 อันนี้สำหรับ Antd Form.Item เท่านั้น
}

export default function DiscountField({ name, ...rest }: DiscountFieldProps) {
    const handleBeforeInput: React.InputEventHandler<HTMLDivElement> = (e) => {
        const inputEl = e.currentTarget.querySelector("input") as HTMLInputElement
        if (!inputEl) return

        const data = (e as unknown as InputEvent).data || ""
        const newValue =
            inputEl.value.substring(0, inputEl.selectionStart || 0) +
            data +
            inputEl.value.substring(inputEl.selectionEnd || 0)

        // ✅ regex: อนุญาตแค่ 0–100 และทศนิยมไม่เกิน 2 หลัก
        const regex = /^(100(\.0{0,2})?|(\d{1,2})(\.\d{0,2})?)?$/

        if (!regex.test(newValue)) {
            e.preventDefault()
        }
    }

    return (
        <Form.Item
            name={name}
            rules={[
                {
                    validator: (_, value) => {
                        if (value === undefined || value === "") {
                            return Promise.resolve()
                        }
                        const num = parseFloat(value)
                        if (isNaN(num) || num < 0 || num > 100) {
                            return Promise.reject("ส่วนลดต้องอยู่ระหว่าง 0–100")
                        }
                        return Promise.resolve()
                    },
                },
            ]}
            getValueFromEvent={(e) => e.target.value}
        >
            <TextField
                label="ส่วนลด (%)"
                variant="standard"
                fullWidth
                inputProps={{
                    inputMode: "decimal",
                }}
                onBeforeInput={handleBeforeInput}
                onKeyDown={(e) => {
                    if (["e", "E", "+", "-", " "].includes(e.key)) {
                        e.preventDefault()
                    }
                }}
                {...rest} // 👈 ตรงนี้จะรับ onBlur, onChange, etc.
            />
        </Form.Item>
    )
}