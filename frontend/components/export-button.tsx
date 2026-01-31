'use client'

import { useState } from 'react'
import { exportData as fetchExportData } from '@/lib/api-service'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileSpreadsheet, FileJson, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'

interface ExportButtonProps {
  entityType: 'leads' | 'deals' | 'tasks' | 'report'
  data?: any[]
  columns?: string[]
  filename?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ExportButton({
  entityType,
  data,
  columns,
  filename,
  variant = 'outline',
  size = 'default',
}: ExportButtonProps) {
  const [exporting, setExporting] = useState<string | null>(null)

  const getFilename = () => {
    const date = new Date().toISOString().split('T')[0]
    return filename || `${entityType}_export_${date}`
  }

  const exportToJSON = async () => {
    setExporting('json')
    try {
      let exportedData
      if (data) {
        exportedData = data
      } else {
        const response = await fetchExportData(entityType, 'json') as { [key: string]: any[] }
        exportedData = response[entityType] || (response as any).data || response
      }

      const blob = new Blob([JSON.stringify(exportedData, null, 2)], {
        type: 'application/json',
      })
      downloadBlob(blob, `${getFilename()}.json`)
      toast.success('Exported to JSON successfully')
    } catch (error: any) {
      toast.error(error.message || 'Export failed')
    } finally {
      setExporting(null)
    }
  }

  const exportToExcel = async () => {
    setExporting('excel')
    try {
      let exportDataRaw
      if (data) {
        exportDataRaw = data
      } else {
        const response = await fetchExportData(entityType, 'json') as { [key: string]: any[] }
        exportDataRaw = response[entityType] || (response as any).data || response
      }

      // Flatten nested objects for Excel
      const flattenedData = Array.isArray(exportDataRaw)
        ? exportDataRaw.map((item) => flattenObject(item))
        : [flattenObject(exportDataRaw)]

      const worksheet = XLSX.utils.json_to_sheet(flattenedData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, entityType)

      // Auto-size columns
      const colWidths = Object.keys(flattenedData[0] || {}).map((key) => ({
        wch: Math.max(key.length, 15),
      }))
      worksheet['!cols'] = colWidths

      XLSX.writeFile(workbook, `${getFilename()}.xlsx`)
      toast.success('Exported to Excel successfully')
    } catch (error: any) {
      toast.error(error.message || 'Export failed')
    } finally {
      setExporting(null)
    }
  }

  const exportToPDF = async () => {
    setExporting('pdf')
    try {
      let exportDataRaw
      if (data) {
        exportDataRaw = data
      } else {
        const response = await fetchExportData(entityType, 'json') as { [key: string]: any[] }
        exportDataRaw = response[entityType] || (response as any).data || response
      }

      const dataArray = Array.isArray(exportDataRaw) ? exportDataRaw : [exportDataRaw]

      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 20
      let yPosition = 20

      // Title
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} Export`, margin, yPosition)
      yPosition += 10

      // Date
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition)
      yPosition += 15

      // Data
      pdf.setFontSize(10)
      dataArray.forEach((item, index) => {
        if (yPosition > 270) {
          pdf.addPage()
          yPosition = 20
        }

        // Item header
        pdf.setFont('helvetica', 'bold')
        pdf.text(`#${index + 1} - ${item.name || item.title || item.id || 'Item'}`, margin, yPosition)
        yPosition += 7

        // Item details
        pdf.setFont('helvetica', 'normal')
        const details = getDisplayFields(item, entityType)
        details.forEach((detail) => {
          if (yPosition > 270) {
            pdf.addPage()
            yPosition = 20
          }
          pdf.text(`${detail.label}: ${detail.value}`, margin + 5, yPosition)
          yPosition += 5
        })

        yPosition += 8
      })

      // Summary
      if (yPosition > 250) {
        pdf.addPage()
        yPosition = 20
      }
      pdf.setFont('helvetica', 'bold')
      pdf.text(`Total: ${dataArray.length} ${entityType}`, margin, yPosition)

      pdf.save(`${getFilename()}.pdf`)
      toast.success('Exported to PDF successfully')
    } catch (error: any) {
      toast.error(error.message || 'Export failed')
    } finally {
      setExporting(null)
    }
  }

  const exportToCSV = async () => {
    setExporting('csv')
    try {
      let exportDataRaw
      if (data) {
        exportDataRaw = data
      } else {
        const response = await fetchExportData(entityType, 'json') as { [key: string]: any[] }
        exportDataRaw = response[entityType] || (response as any).data || response
      }

      const dataArray = Array.isArray(exportDataRaw) ? exportDataRaw : [exportDataRaw]
      const flattenedData = dataArray.map((item) => flattenObject(item))

      if (flattenedData.length === 0) {
        toast.error('No data to export')
        return
      }

      const headers = Object.keys(flattenedData[0])
      const csvContent = [
        headers.join(','),
        ...flattenedData.map((row) =>
          headers
            .map((header) => {
              const value = row[header]
              if (value === null || value === undefined) return ''
              const stringValue = String(value)
              // Escape quotes and wrap in quotes if contains comma or quote
              if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`
              }
              return stringValue
            })
            .join(',')
        ),
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      downloadBlob(blob, `${getFilename()}.csv`)
      toast.success('Exported to CSV successfully')
    } catch (error: any) {
      toast.error(error.message || 'Export failed')
    } finally {
      setExporting(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} disabled={!!exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel} disabled={!!exporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          Export to Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} disabled={!!exporting}>
          <FileText className="h-4 w-4 mr-2 text-blue-600" />
          Export to CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} disabled={!!exporting}>
          <FileText className="h-4 w-4 mr-2 text-red-600" />
          Export to PDF
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToJSON} disabled={!!exporting}>
          <FileJson className="h-4 w-4 mr-2 text-yellow-600" />
          Export to JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Helper functions
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function flattenObject(obj: any, prefix = ''): Record<string, any> {
  const result: Record<string, any> = {}

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}_${key}` : key
      const value = obj[key]

      if (value === null || value === undefined) {
        result[newKey] = ''
      } else if (Array.isArray(value)) {
        result[newKey] = value.map((v) => (typeof v === 'object' ? JSON.stringify(v) : v)).join(', ')
      } else if (typeof value === 'object' && !(value instanceof Date)) {
        Object.assign(result, flattenObject(value, newKey))
      } else if (value instanceof Date) {
        result[newKey] = value.toISOString()
      } else {
        result[newKey] = value
      }
    }
  }

  return result
}

function getDisplayFields(item: any, entityType: string): Array<{ label: string; value: string }> {
  const commonFields: Array<{ key: string; label: string; format?: (v: any) => string }> = [
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'company', label: 'Company' },
    { key: 'status', label: 'Status' },
    { key: 'stage', label: 'Stage' },
    { key: 'value', label: 'Value', format: (v: number) => `$${v.toLocaleString()}` },
    { key: 'priority', label: 'Priority' },
    { key: 'dueDate', label: 'Due Date', format: (v: string) => new Date(v).toLocaleDateString() },
    { key: 'createdAt', label: 'Created', format: (v: string) => new Date(v).toLocaleDateString() },
  ]

  return commonFields
    .filter((field) => item[field.key] !== undefined && item[field.key] !== null)
    .map((field) => ({
      label: field.label,
      value: field.format ? field.format(item[field.key]) : String(item[field.key]),
    }))
}
