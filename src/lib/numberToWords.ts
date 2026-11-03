/**
 * Converts a positive number to English words for receipts and invoices.
 */
export function numberToWords(n: number): string {
  if (!n || isNaN(n) || n === 0) return 'Zero'
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ]
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  const conv = (num: number): string => {
    if (num < 20) return ones[num]
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '')
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + conv(num % 100) : '')
    if (num < 1000000) return conv(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + conv(num % 1000) : '')
    return conv(Math.floor(num / 1000000)) + ' Million' + (num % 1000000 ? ' ' + conv(num % 1000000) : '')
  }

  return conv(Math.floor(Math.abs(n))).trim()
}
