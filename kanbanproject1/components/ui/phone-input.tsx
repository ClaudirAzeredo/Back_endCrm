"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

const COUNTRIES = [
  { code: "BR", name: "Brazil (Brasil)", dialCode: "+55", flag: "🇧🇷", format: "(00) 00000-0000" },
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸", format: "(000) 000-0000" },
  { code: "AF", name: "Afghanistan (‫افغانستان‬‎)", dialCode: "+93", flag: "🇦🇫", format: "00 000 0000" },
  { code: "AL", name: "Albania (Shqipëri)", dialCode: "+355", flag: "🇦🇱", format: "00 000 0000" },
  { code: "DZ", name: "Algeria (‫الجزائر‬‎)", dialCode: "+213", flag: "🇩🇿", format: "00 00 00 00 00" },
  { code: "AS", name: "American Samoa", dialCode: "+1684", flag: "🇦🇸", format: "(000) 000-0000" },
  { code: "AD", name: "Andorra", dialCode: "+376", flag: "🇦🇩", format: "000 000" },
  { code: "AO", name: "Angola", dialCode: "+244", flag: "🇦🇴", format: "000 000 000" },
  { code: "AI", name: "Anguilla", dialCode: "+1264", flag: "🇦🇮", format: "(000) 000-0000" },
  { code: "AG", name: "Antigua and Barbuda", dialCode: "+1268", flag: "🇦🇬", format: "(000) 000-0000" },
  { code: "AR", name: "Argentina", dialCode: "+54", flag: "🇦🇷", format: "00 0000-0000" },
  { code: "AM", name: "Armenia (Հայաստան)", dialCode: "+374", flag: "🇦🇲", format: "00 000000" },
  { code: "AW", name: "Aruba", dialCode: "+297", flag: "🇦🇼", format: "000 0000" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺", format: "0000 000 000" },
  { code: "AT", name: "Austria (Österreich)", dialCode: "+43", flag: "🇦🇹", format: "0000 000000" },
  { code: "AZ", name: "Azerbaijan (Azərbaycan)", dialCode: "+994", flag: "🇦🇿", format: "00 000 00 00" },
  { code: "BS", name: "Bahamas", dialCode: "+1242", flag: "🇧🇸", format: "(000) 000-0000" },
  { code: "BH", name: "Bahrain (‫البحرين‬‎)", dialCode: "+973", flag: "🇧🇭", format: "0000 0000" },
  { code: "BD", name: "Bangladesh (বাংলাদেশ)", dialCode: "+880", flag: "🇧🇩", format: "00000-000000" },
  { code: "BB", name: "Barbados", dialCode: "+1246", flag: "🇧🇧", format: "(000) 000-0000" },
  { code: "BY", name: "Belarus (Беларусь)", dialCode: "+375", flag: "🇧🇾", format: "00 000-00-00" },
  { code: "BE", name: "Belgium (België)", dialCode: "+32", flag: "🇧🇪", format: "0000 00 00 00" },
  { code: "BZ", name: "Belize", dialCode: "+501", flag: "🇧🇿", format: "000-0000" },
  { code: "BJ", name: "Benin (Bénin)", dialCode: "+229", flag: "🇧🇯", format: "00 00 00 00" },
  { code: "BM", name: "Bermuda", dialCode: "+1441", flag: "🇧🇲", format: "(000) 000-0000" },
  { code: "BT", name: "Bhutan (འབྲུག)", dialCode: "+975", flag: "🇧🇹", format: "00 00 00 00" },
  { code: "BO", name: "Bolivia", dialCode: "+591", flag: "🇧🇴", format: "0 000 0000" },
  {
    code: "BA",
    name: "Bosnia and Herzegovina (Босна и Херцеговина)",
    dialCode: "+387",
    flag: "🇧🇦",
    format: "00 000 000",
  },
  { code: "BW", name: "Botswana", dialCode: "+267", flag: "🇧🇼", format: "00 000 000" },
  { code: "BN", name: "Brunei", dialCode: "+673", flag: "🇧🇳", format: "000 0000" },
  { code: "BG", name: "Bulgaria (България)", dialCode: "+359", flag: "🇧🇬", format: "000 000 000" },
  { code: "BF", name: "Burkina Faso", dialCode: "+226", flag: "🇧🇫", format: "00 00 00 00" },
  { code: "BI", name: "Burundi (Uburundi)", dialCode: "+257", flag: "🇧🇮", format: "00 00 00 00" },
  { code: "KH", name: "Cambodia (កម្ពុជា)", dialCode: "+855", flag: "🇰🇭", format: "00 000 000" },
  { code: "CM", name: "Cameroon (Cameroun)", dialCode: "+237", flag: "🇨🇲", format: "0 00 00 00 00" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦", format: "(000) 000-0000" },
  { code: "CV", name: "Cape Verde (Kabu Verdi)", dialCode: "+238", flag: "🇨🇻", format: "000 00 00" },
  { code: "KY", name: "Cayman Islands", dialCode: "+1345", flag: "🇰🇾", format: "(000) 000-0000" },
  { code: "CF", name: "Central African Republic", dialCode: "+236", flag: "🇨🇫", format: "00 00 00 00" },
  { code: "TD", name: "Chad (Tchad)", dialCode: "+235", flag: "🇹🇩", format: "00 00 00 00" },
  { code: "CL", name: "Chile", dialCode: "+56", flag: "🇨🇱", format: "0 0000 0000" },
  { code: "CN", name: "China (中国)", dialCode: "+86", flag: "🇨🇳", format: "000 0000 0000" },
  { code: "CO", name: "Colombia", dialCode: "+57", flag: "🇨🇴", format: "000 0000000" },
  { code: "KM", name: "Comoros (‫جزر القمر‬‎)", dialCode: "+269", flag: "🇰🇲", format: "000 00 00" },
  { code: "CG", name: "Congo (Republic)", dialCode: "+242", flag: "🇨🇬", format: "00 000 0000" },
  { code: "CD", name: "Congo (DRC)", dialCode: "+243", flag: "🇨🇩", format: "000 000 000" },
  { code: "CK", name: "Cook Islands", dialCode: "+682", flag: "🇨🇰", format: "00 000" },
  { code: "CR", name: "Costa Rica", dialCode: "+506", flag: "🇨🇷", format: "0000 0000" },
  { code: "CI", name: "Côte d'Ivoire", dialCode: "+225", flag: "🇨🇮", format: "00 00 00 00" },
  { code: "HR", name: "Croatia (Hrvatska)", dialCode: "+385", flag: "🇭🇷", format: "00 000 0000" },
  { code: "CU", name: "Cuba", dialCode: "+53", flag: "🇨🇺", format: "0 0000000" },
  { code: "CW", name: "Curaçao", dialCode: "+599", flag: "🇨🇼", format: "0 000 0000" },
  { code: "CY", name: "Cyprus (Κύπρος)", dialCode: "+357", flag: "🇨🇾", format: "00 000000" },
  { code: "CZ", name: "Czech Republic (Česká republika)", dialCode: "+420", flag: "🇨🇿", format: "000 000 000" },
  { code: "DK", name: "Denmark (Danmark)", dialCode: "+45", flag: "🇩🇰", format: "00 00 00 00" },
  { code: "DJ", name: "Djibouti", dialCode: "+253", flag: "🇩🇯", format: "00 00 00 00" },
  { code: "DM", name: "Dominica", dialCode: "+1767", flag: "🇩🇲", format: "(000) 000-0000" },
  { code: "DO", name: "Dominican Republic", dialCode: "+1", flag: "🇩🇴", format: "(000) 000-0000" },
  { code: "EC", name: "Ecuador", dialCode: "+593", flag: "🇪🇨", format: "00 000 0000" },
  { code: "EG", name: "Egypt (‫مصر‬‎)", dialCode: "+20", flag: "🇪🇬", format: "000 000 0000" },
  { code: "SV", name: "El Salvador", dialCode: "+503", flag: "🇸🇻", format: "0000 0000" },
  { code: "GQ", name: "Equatorial Guinea", dialCode: "+240", flag: "🇬🇶", format: "000 000 000" },
  { code: "ER", name: "Eritrea", dialCode: "+291", flag: "🇪🇷", format: "0 000 000" },
  { code: "EE", name: "Estonia (Eesti)", dialCode: "+372", flag: "🇪🇪", format: "0000 0000" },
  { code: "ET", name: "Ethiopia", dialCode: "+251", flag: "🇪🇹", format: "00 000 0000" },
  { code: "FJ", name: "Fiji", dialCode: "+679", flag: "🇫🇯", format: "000 0000" },
  { code: "FI", name: "Finland (Suomi)", dialCode: "+358", flag: "🇫🇮", format: "00 0000000" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷", format: "0 00 00 00 00" },
  { code: "GF", name: "French Guiana", dialCode: "+594", flag: "🇬🇫", format: "00000 0000" },
  { code: "PF", name: "French Polynesia", dialCode: "+689", flag: "🇵🇫", format: "00 00 00 00" },
  { code: "GA", name: "Gabon", dialCode: "+241", flag: "🇬🇦", format: "0 00 00 00" },
  { code: "GM", name: "Gambia", dialCode: "+220", flag: "🇬🇲", format: "000 0000" },
  { code: "GE", name: "Georgia (საქართველო)", dialCode: "+995", flag: "🇬🇪", format: "000 00 00 00" },
  { code: "DE", name: "Germany (Deutschland)", dialCode: "+49", flag: "🇩🇪", format: "0000 0000000" },
  { code: "GH", name: "Ghana (Gaana)", dialCode: "+233", flag: "🇬🇭", format: "000 000 0000" },
  { code: "GI", name: "Gibraltar", dialCode: "+350", flag: "🇬🇮", format: "00000000" },
  { code: "GR", name: "Greece (Ελλάδα)", dialCode: "+30", flag: "🇬🇷", format: "000 000 0000" },
  { code: "GL", name: "Greenland (Kalaallit Nunaat)", dialCode: "+299", flag: "🇬🇱", format: "00 00 00" },
  { code: "GD", name: "Grenada", dialCode: "+1473", flag: "🇬🇩", format: "(000) 000-0000" },
  { code: "GP", name: "Guadeloupe", dialCode: "+590", flag: "🇬🇵", format: "0000 00 00 00" },
  { code: "GU", name: "Guam", dialCode: "+1671", flag: "🇬🇺", format: "(000) 000-0000" },
  { code: "GT", name: "Guatemala", dialCode: "+502", flag: "🇬🇹", format: "0000 0000" },
  { code: "GN", name: "Guinea (Guinée)", dialCode: "+224", flag: "🇬🇳", format: "00 00 00 00" },
  { code: "GW", name: "Guinea-Bissau (Guiné Bissau)", dialCode: "+245", flag: "🇬🇼", format: "000 000 000" },
  { code: "GY", name: "Guyana", dialCode: "+592", flag: "🇬🇾", format: "000 0000" },
  { code: "HT", name: "Haiti", dialCode: "+509", flag: "🇭🇹", format: "00 00 0000" },
  { code: "HN", name: "Honduras", dialCode: "+504", flag: "🇭🇳", format: "0000-0000" },
  { code: "HK", name: "Hong Kong (香港)", dialCode: "+852", flag: "🇭🇰", format: "0000 0000" },
  { code: "HU", name: "Hungary (Magyarország)", dialCode: "+36", flag: "🇭🇺", format: "00 000 0000" },
  { code: "IS", name: "Iceland (Ísland)", dialCode: "+354", flag: "🇮🇸", format: "000 0000" },
  { code: "IN", name: "India (भारत)", dialCode: "+91", flag: "🇮🇳", format: "00000 00000" },
  { code: "ID", name: "Indonesia", dialCode: "+62", flag: "🇮🇩", format: "0000-000-000" },
  { code: "IR", name: "Iran (‫ایران‬‎)", dialCode: "+98", flag: "🇮🇷", format: "000 000 0000" },
  { code: "IQ", name: "Iraq (‫العراق‬‎)", dialCode: "+964", flag: "🇮🇶", format: "000 000 0000" },
  { code: "IE", name: "Ireland", dialCode: "+353", flag: "🇮🇪", format: "00 000 0000" },
  { code: "IL", name: "Israel (‫ישראל‬‎)", dialCode: "+972", flag: "🇮🇱", format: "00-000-0000" },
  { code: "IT", name: "Italy (Italia)", dialCode: "+39", flag: "🇮🇹", format: "000 000 0000" },
  { code: "JM", name: "Jamaica", dialCode: "+1876", flag: "🇯🇲", format: "(000) 000-0000" },
  { code: "JP", name: "Japan (日本)", dialCode: "+81", flag: "🇯🇵", format: "00-0000-0000" },
  { code: "JO", name: "Jordan (‫الأردن‬‎)", dialCode: "+962", flag: "🇯🇴", format: "0 0000 0000" },
  { code: "KZ", name: "Kazakhstan (Казахстан)", dialCode: "+7", flag: "🇰🇿", format: "000 000-00-00" },
  { code: "KE", name: "Kenya", dialCode: "+254", flag: "🇰🇪", format: "000 000000" },
  { code: "KI", name: "Kiribati", dialCode: "+686", flag: "🇰🇮", format: "00000" },
  { code: "KW", name: "Kuwait (‫الكويت‬‎)", dialCode: "+965", flag: "🇰🇼", format: "0000 0000" },
  { code: "KG", name: "Kyrgyzstan (Кыргызстан)", dialCode: "+996", flag: "🇰🇬", format: "000 000 000" },
  { code: "LA", name: "Laos (ລາວ)", dialCode: "+856", flag: "🇱🇦", format: "00 00 000 000" },
  { code: "LV", name: "Latvia (Latvija)", dialCode: "+371", flag: "🇱🇻", format: "00 000 000" },
  { code: "LB", name: "Lebanon (‫لبنان‬‎)", dialCode: "+961", flag: "🇱🇧", format: "00 000 000" },
  { code: "LS", name: "Lesotho", dialCode: "+266", flag: "🇱🇸", format: "0000 0000" },
  { code: "LR", name: "Liberia", dialCode: "+231", flag: "🇱🇷", format: "00 000 0000" },
  { code: "LY", name: "Libya (‫ليبيا‬‎)", dialCode: "+218", flag: "🇱🇾", format: "00-0000000" },
  { code: "LI", name: "Liechtenstein", dialCode: "+423", flag: "🇱🇮", format: "000 0000" },
  { code: "LT", name: "Lithuania (Lietuva)", dialCode: "+370", flag: "🇱🇹", format: "000 00000" },
  { code: "LU", name: "Luxembourg", dialCode: "+352", flag: "🇱🇺", format: "000 000 000" },
  { code: "MO", name: "Macau (澳門)", dialCode: "+853", flag: "🇲🇴", format: "0000 0000" },
  { code: "MK", name: "Macedonia (FYROM) (Македонија)", dialCode: "+389", flag: "🇲🇰", format: "00 000 000" },
  { code: "MG", name: "Madagascar (Madagasikara)", dialCode: "+261", flag: "🇲🇬", format: "00 00 000 00" },
  { code: "MW", name: "Malawi", dialCode: "+265", flag: "🇲🇼", format: "0 0000 0000" },
  { code: "MY", name: "Malaysia", dialCode: "+60", flag: "🇲🇾", format: "00-000 0000" },
  { code: "MV", name: "Maldives", dialCode: "+960", flag: "🇲🇻", format: "000-0000" },
  { code: "ML", name: "Mali", dialCode: "+223", flag: "🇲🇱", format: "00 00 00 00" },
  { code: "MT", name: "Malta", dialCode: "+356", flag: "🇲🇹", format: "0000 0000" },
  { code: "MH", name: "Marshall Islands", dialCode: "+692", flag: "🇲🇭", format: "000-0000" },
  { code: "MQ", name: "Martinique", dialCode: "+596", flag: "🇲🇶", format: "0000 00 00 00" },
  { code: "MR", name: "Mauritania (‫موريتانيا‬‎)", dialCode: "+222", flag: "🇲🇷", format: "00 00 00 00" },
  { code: "MU", name: "Mauritius (Moris)", dialCode: "+230", flag: "🇲🇺", format: "0000 0000" },
  { code: "MX", name: "Mexico (México)", dialCode: "+52", flag: "🇲🇽", format: "00 0000 0000" },
  { code: "FM", name: "Micronesia", dialCode: "+691", flag: "🇫🇲", format: "000 0000" },
  { code: "MD", name: "Moldova (Republica Moldova)", dialCode: "+373", flag: "🇲🇩", format: "0000 0000" },
  { code: "MC", name: "Monaco", dialCode: "+377", flag: "🇲🇨", format: "00 00 00 00" },
  { code: "MN", name: "Mongolia (Монгол)", dialCode: "+976", flag: "🇲🇳", format: "00 00 0000" },
  { code: "ME", name: "Montenegro (Crna Gora)", dialCode: "+382", flag: "🇲🇪", format: "00 000 000" },
  { code: "MS", name: "Montserrat", dialCode: "+1664", flag: "🇲🇸", format: "(000) 000-0000" },
  { code: "MA", name: "Morocco (‫المغرب‬‎)", dialCode: "+212", flag: "🇲🇦", format: "00-0000000" },
  { code: "MZ", name: "Mozambique (Moçambique)", dialCode: "+258", flag: "🇲🇿", format: "00 000 0000" },
  { code: "MM", name: "Myanmar (Burma) (မြန်မာ)", dialCode: "+95", flag: "🇲🇲", format: "00 000 0000" },
  { code: "NA", name: "Namibia (Namibië)", dialCode: "+264", flag: "🇳🇦", format: "00 000 0000" },
  { code: "NR", name: "Nauru", dialCode: "+674", flag: "🇳🇷", format: "000 0000" },
  { code: "NP", name: "Nepal (नेपाल)", dialCode: "+977", flag: "🇳🇵", format: "00-000-0000" },
  { code: "NL", name: "Netherlands (Nederland)", dialCode: "+31", flag: "🇳🇱", format: "00 00000000" },
  { code: "NC", name: "New Caledonia", dialCode: "+687", flag: "🇳🇨", format: "00.00.00" },
  { code: "NZ", name: "New Zealand", dialCode: "+64", flag: "🇳🇿", format: "00 000 0000" },
  { code: "NI", name: "Nicaragua", dialCode: "+505", flag: "🇳🇮", format: "0000 0000" },
  { code: "NE", name: "Niger (Nijar)", dialCode: "+227", flag: "🇳🇪", format: "00 00 00 00" },
  { code: "NG", name: "Nigeria", dialCode: "+234", flag: "🇳🇬", format: "000 000 0000" },
  { code: "NU", name: "Niue", dialCode: "+683", flag: "🇳🇺", format: "0000" },
  { code: "NF", name: "Norfolk Island", dialCode: "+672", flag: "🇳🇫", format: "000 000" },
  { code: "KP", name: "North Korea (조선 민주주의 인민 공화국)", dialCode: "+850", flag: "🇰🇵", format: "000 000 0000" },
  { code: "MP", name: "Northern Mariana Islands", dialCode: "+1670", flag: "🇲🇵", format: "(000) 000-0000" },
  { code: "NO", name: "Norway (Norge)", dialCode: "+47", flag: "🇳🇴", format: "000 00 000" },
  { code: "OM", name: "Oman (‫عُمان‬‎)", dialCode: "+968", flag: "🇴🇲", format: "0000 0000" },
  { code: "PK", name: "Pakistan (‫پاکستان‬‎)", dialCode: "+92", flag: "🇵🇰", format: "000 0000000" },
  { code: "PW", name: "Palau", dialCode: "+680", flag: "🇵🇼", format: "000 0000" },
  { code: "PS", name: "Palestine (‫فلسطين‬‎)", dialCode: "+970", flag: "🇵🇸", format: "00 000 0000" },
  { code: "PA", name: "Panama (Panamá)", dialCode: "+507", flag: "🇵🇦", format: "0000-0000" },
  { code: "PG", name: "Papua New Guinea", dialCode: "+675", flag: "🇵🇬", format: "000 0000" },
  { code: "PY", name: "Paraguay", dialCode: "+595", flag: "🇵🇾", format: "000 000000" },
  { code: "PE", name: "Peru (Perú)", dialCode: "+51", flag: "🇵🇪", format: "000 000 000" },
  { code: "PH", name: "Philippines", dialCode: "+63", flag: "🇵🇭", format: "0000 000 0000" },
  { code: "PL", name: "Poland (Polska)", dialCode: "+48", flag: "🇵🇱", format: "000 000 000" },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹", format: "00 000 0000" },
  { code: "PR", name: "Puerto Rico", dialCode: "+1", flag: "🇵🇷", format: "(000) 000-0000" },
  { code: "QA", name: "Qatar (‫قطر‬‎)", dialCode: "+974", flag: "🇶🇦", format: "0000 0000" },
  { code: "RE", name: "Réunion (La Réunion)", dialCode: "+262", flag: "🇷🇪", format: "0000 00 00 00" },
  { code: "RO", name: "Romania (România)", dialCode: "+40", flag: "🇷🇴", format: "000 000 000" },
  { code: "RU", name: "Russia (Россия)", dialCode: "+7", flag: "🇷🇺", format: "000 000-00-00" },
  { code: "RW", name: "Rwanda", dialCode: "+250", flag: "🇷🇼", format: "000 000 000" },
  { code: "WS", name: "Samoa", dialCode: "+685", flag: "🇼🇸", format: "00 0000" },
  { code: "SM", name: "San Marino", dialCode: "+378", flag: "🇸🇲", format: "0000 000000" },
  { code: "ST", name: "São Tomé and Príncipe", dialCode: "+239", flag: "🇸🇹", format: "000 0000" },
  { code: "SA", name: "Saudi Arabia (‫المملكة العربية السعودية‬‎)", dialCode: "+966", flag: "🇸🇦", format: "00 000 0000" },
  { code: "SN", name: "Senegal (Sénégal)", dialCode: "+221", flag: "🇸🇳", format: "00 000 00 00" },
  { code: "RS", name: "Serbia (Србија)", dialCode: "+381", flag: "🇷🇸", format: "00 0000000" },
  { code: "SC", name: "Seychelles", dialCode: "+248", flag: "🇸🇨", format: "0 000 000" },
  { code: "SL", name: "Sierra Leone", dialCode: "+232", flag: "🇸🇱", format: "00 000000" },
  { code: "SG", name: "Singapore", dialCode: "+65", flag: "🇸🇬", format: "0000 0000" },
  { code: "SK", name: "Slovakia (Slovensko)", dialCode: "+421", flag: "🇸🇰", format: "000 000 000" },
  { code: "SI", name: "Slovenia (Slovenija)", dialCode: "+386", flag: "🇸🇮", format: "00 000 000" },
  { code: "SB", name: "Solomon Islands", dialCode: "+677", flag: "🇸🇧", format: "00000" },
  { code: "SO", name: "Somalia (Soomaaliya)", dialCode: "+252", flag: "🇸🇴", format: "0 000 000" },
  { code: "ZA", name: "South Africa", dialCode: "+27", flag: "🇿🇦", format: "00 000 0000" },
  { code: "KR", name: "South Korea (대한민국)", dialCode: "+82", flag: "🇰🇷", format: "00-0000-0000" },
  { code: "SS", name: "South Sudan (‫جنوب السودان‬‎)", dialCode: "+211", flag: "🇸🇸", format: "00 000 0000" },
  { code: "ES", name: "Spain (España)", dialCode: "+34", flag: "🇪🇸", format: "000 00 00 00" },
  { code: "LK", name: "Sri Lanka (ශ්‍රී ලංකාව)", dialCode: "+94", flag: "🇱🇰", format: "00 000 0000" },
  { code: "SD", name: "Sudan (‫السودان‬‎)", dialCode: "+249", flag: "🇸🇩", format: "00 000 0000" },
  { code: "SR", name: "Suriname", dialCode: "+597", flag: "🇸🇷", format: "000-0000" },
  { code: "SZ", name: "Swaziland", dialCode: "+268", flag: "🇸🇿", format: "0000 0000" },
  { code: "SE", name: "Sweden (Sverige)", dialCode: "+46", flag: "🇸🇪", format: "00-000 00 00" },
  { code: "CH", name: "Switzerland (Schweiz)", dialCode: "+41", flag: "🇨🇭", format: "00 000 00 00" },
  { code: "SY", name: "Syria (‫سوريا‬‎)", dialCode: "+963", flag: "🇸🇾", format: "00 0000 000" },
  { code: "TW", name: "Taiwan (台灣)", dialCode: "+886", flag: "🇹🇼", format: "0000 000 000" },
  { code: "TJ", name: "Tajikistan", dialCode: "+992", flag: "🇹🇯", format: "00 000 0000" },
  { code: "TZ", name: "Tanzania", dialCode: "+255", flag: "🇹🇿", format: "00 000 0000" },
  { code: "TH", name: "Thailand (ไทย)", dialCode: "+66", flag: "🇹🇭", format: "00 000 0000" },
  { code: "TL", name: "Timor-Leste", dialCode: "+670", flag: "🇹🇱", format: "000 0000" },
  { code: "TG", name: "Togo", dialCode: "+228", flag: "🇹🇬", format: "00 00 00 00" },
  { code: "TK", name: "Tokelau", dialCode: "+690", flag: "🇹🇰", format: "0000" },
  { code: "TO", name: "Tonga", dialCode: "+676", flag: "🇹🇴", format: "00000" },
  { code: "TT", name: "Trinidad and Tobago", dialCode: "+1868", flag: "🇹🇹", format: "(000) 000-0000" },
  { code: "TN", name: "Tunisia (‫تونس‬‎)", dialCode: "+216", flag: "🇹🇳", format: "00 000 000" },
  { code: "TR", name: "Turkey (Türkiye)", dialCode: "+90", flag: "🇹🇷", format: "000 000 0000" },
  { code: "TM", name: "Turkmenistan", dialCode: "+993", flag: "🇹🇲", format: "0 000 0000" },
  { code: "TC", name: "Turks and Caicos Islands", dialCode: "+1649", flag: "🇹🇨", format: "(000) 000-0000" },
  { code: "TV", name: "Tuvalu", dialCode: "+688", flag: "🇹🇻", format: "00000" },
  { code: "UG", name: "Uganda", dialCode: "+256", flag: "🇺🇬", format: "000 000000" },
  { code: "UA", name: "Ukraine (Україна)", dialCode: "+380", flag: "🇺🇦", format: "00 000 00 00" },
  {
    code: "AE",
    name: "United Arab Emirates (‫الإمارات العربية المتحدة‬‎)",
    dialCode: "+971",
    flag: "🇦🇪",
    format: "00 000 0000",
  },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧", format: "0000 000000" },
  { code: "UY", name: "Uruguay", dialCode: "+598", flag: "🇺🇾", format: "0 000 00 00" },
  { code: "UZ", name: "Uzbekistan (Oʻzbekiston)", dialCode: "+998", flag: "🇺🇿", format: "00 000 00 00" },
  { code: "VU", name: "Vanuatu", dialCode: "+678", flag: "🇻🇺", format: "00000" },
  { code: "VA", name: "Vatican City (Città del Vaticano)", dialCode: "+39", flag: "🇻🇦", format: "0 0000 0000" },
  { code: "VE", name: "Venezuela", dialCode: "+58", flag: "🇻🇪", format: "000-0000000" },
  { code: "VN", name: "Vietnam (Việt Nam)", dialCode: "+84", flag: "🇻🇳", format: "00 0000 0000" },
  { code: "YE", name: "Yemen (‫اليمن‬‎)", dialCode: "+967", flag: "🇾🇪", format: "000 000 000" },
  { code: "ZM", name: "Zambia", dialCode: "+260", flag: "🇿🇲", format: "00 000 0000" },
  { code: "ZW", name: "Zimbabwe", dialCode: "+263", flag: "🇿🇼", format: "0 000 000" },
]

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  defaultCountry?: string
  className?: string
  disabled?: boolean
}

export function PhoneInputComponent({
  value,
  onChange,
  placeholder = "Telefone",
  defaultCountry = "br",
  className,
  disabled = false,
}: PhoneInputProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [selectedCountry, setSelectedCountry] = React.useState(
    COUNTRIES.find((c) => c.code.toLowerCase() === defaultCountry.toLowerCase()) || COUNTRIES[0],
  )

  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(search.toLowerCase()) ||
      country.dialCode.includes(search) ||
      country.code.toLowerCase().includes(search.toLowerCase()),
  )

  const handleCountrySelect = (country: (typeof COUNTRIES)[0]) => {
    setSelectedCountry(country)
    setOpen(false)
    // Update the value with the new country code
    const phoneNumber = value.replace(/^\+\d+\s*/, "")
    onChange(`${country.dialCode} ${phoneNumber}`)
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value
    // Remove the country code if it exists
    const phoneNumber = input.replace(/^\+\d+\s*/, "")
    onChange(`${selectedCountry.dialCode} ${phoneNumber}`)
  }

  // Extract phone number without country code for display
  const displayValue = value.replace(/^\+\d+\s*/, "")

  return (
    <div className={cn("flex gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[140px] justify-between bg-transparent"
            disabled={disabled}
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-sm">{selectedCountry.dialCode}</span>
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Buscar país..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <ScrollArea className="h-[300px]">
            <div className="p-1">
              {filteredCountries.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">País não encontrado</div>
              ) : (
                filteredCountries.map((country) => (
                  <Button
                    key={country.code}
                    variant="ghost"
                    className="w-full justify-start font-normal"
                    onClick={() => handleCountrySelect(country)}
                  >
                    <span className="mr-2 text-lg">{country.flag}</span>
                    <span className="flex-1 text-left">{country.name}</span>
                    <span className="text-muted-foreground">{country.dialCode}</span>
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      <Input
        type="tel"
        placeholder={placeholder}
        value={displayValue}
        onChange={handlePhoneChange}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  )
}
