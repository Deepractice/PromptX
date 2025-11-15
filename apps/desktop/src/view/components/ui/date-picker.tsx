import * as React from "react"
import { format } from "date-fns"
import { zhCN, enUS } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import "react-day-picker/style.css"

interface DatePickerProps {
  value?: Date | null
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
}: DatePickerProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    value || undefined
  )

  // 根据当前语言选择 date-fns locale
  const locale = i18n.language === "zh-CN" ? zhCN : enUS

  const handleSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    onChange?.(date)
    if (date) {
      setOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedDate(undefined)
    onChange?.(undefined)
  }

  React.useEffect(() => {
    setSelectedDate(value || undefined)
  }, [value])

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "w-full justify-start text-left font-normal",
          !selectedDate && "text-muted-foreground",
          className
        )}
        onClick={() => setOpen(true)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {selectedDate ? (
          <span className="flex-1">
            {format(selectedDate, "PPP", { locale })}
          </span>
        ) : (
          <span className="flex-1">{placeholder || t("datePicker.placeholder")}</span>
        )}
        {selectedDate && (
          <span
            className="ml-2 text-xs hover:text-destructive"
            onClick={handleClear}
          >
            {t("datePicker.clear")}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-auto p-6">
          <DialogHeader>
            <DialogTitle>{t("datePicker.selectDate")}</DialogTitle>
          </DialogHeader>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            locale={locale}
            className="mx-auto"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
