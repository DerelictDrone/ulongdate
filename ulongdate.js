const util = require('util')
class ULongDate extends Date {
	constructor(buffer,LEndian = true) {
		if(!buffer) {
			super()
			this.setFullYear(super.getFullYear())
			this.setDate(super.getDate())
			this.setMonth(super.getMonth())
			this.setHours(super.getHours())
			this.setMinutes(super.getMinutes())
			this.setSeconds(super.getSeconds())
			this.setMilliseconds(super.getMilliseconds())
			this.Timezone = Math.floor(super.getTimezoneOffset()/60)
			return
		}
		if(buffer[0]) {
			super()
			const binary = bitWriter(buffer.readUintLE(0,4),32) + bitWriter(buffer.readUintLE(4,4),32)
			let index = 0
			const year = bitReader(binary.slice(index,index+=22))
			this.setFullYear(typeof year === "bigint" ? -1 : year)
			this.FullYearBig = BigInt(year)
			const date  = bitReader(binary.slice(index,index+=5))
			this.setDate(date === 0 ? 1 : date)
			this.date = date
			this.setMonth(bitReader(binary.slice(index,index+=4)))
			this.setHours(bitReader(binary.slice(index,index+=5)))
			this.setMinutes(bitReader(binary.slice(index,index+=6)))
			this.setSeconds(bitReader(binary.slice(index,index+=6)))
			this.setMilliseconds(bitReader(binary.slice(index,index+=10)))
			this.Timezone = bitReader(binary.slice(index,index+=6),{LEndian: false, signed: true}) // Basically hour offsets
			return
		} else { 
			super(buffer)
		}
	}
	[util.inspect.custom] () {
		const month = this.getMonth()+1
		const date = this.getDate()
		const seconds = this.getSeconds()
		return `${this.getFullYear(true)}-${month < 10 ? "0"+month : month}-${date < 10 ? "0"+date : date}T${this.getHours()}-${this.getMinutes()}-${this.getSeconds()}.${this.getMilliseconds()}Z`
	}
	toBuffer(LEndian = true) {
		let buffer = new Buffer.allocUnsafe(8)
		let string = ""
		string += bitWriter(this.getFullYear(true),22)
		string += bitWriter(this.getDate(),5)
		string += bitWriter(this.getMonth(),4)
		string += bitWriter(this.getHours(),5)
		string += bitWriter(this.getMinutes(),6)
		string += bitWriter(this.getSeconds(),6)
		string += bitWriter(this.getMilliseconds(),10)
		string += bitWriter(this.Timezone,6,{signed: true})
		// console.log(string.length)
		string = LEndian ? string : string.split('').reverse().join('')
		if(LEndian) {
			buffer.writeUIntLE(bitReader(string.slice(0,32)),0,4)
			// console.log(buffer)
			buffer.writeUIntLE(bitReader(string.slice(32,64)),4,4)
			// console.log(buffer)
		} else {
			buffer.writeUIntBE(bitReader(string.slice(0,32)),0,4)
			buffer.writeUIntBE(bitReader(string.slice(32,64)),0,4)
		}
		return buffer
	}
	getDate() {
		return this.date // I do this for each one because past year 27560 the normal date contents break down and are set to nan, this technically fixes that.
	}
	setDate(dayofmonth) {
		super.setDate(dayofmonth)
		this.date = dayofmonth
	}
	getMonth() {
		return this.month
	}
	setMonth(month) {
		super.setMonth(month)
		this.month = month
	}
	getHours() {
		return this.hours
	}
	setHours(hours) {
		super.setHours(hours)
		this.hours = hours
	}
	getMinutes() {
		return this.minutes
	}
	setMinutes(minutes) {
		super.setMinutes(minutes)
		this.minutes = minutes
	}
	getSeconds() {
		return this.seconds
	}
	setSeconds(seconds) {
		super.setSeconds(seconds)
		this.seconds = seconds
	}
	getMilliseconds() {
		return this.milliseconds
	}
	setMilliseconds(milliseconds) {
		super.setMilliseconds(milliseconds)
		this.milliseconds = milliseconds
	}
	getTimezone() {
		return this.Timezone
	}
	setTimezone(timezone) {
		this.Timezone = timezone
	}
	convertTimezone(timezone) {
		const oldTimezone = this.Timezone
		const hours = this.getHours()
		this.setHours(hours + (timezone - oldTimezone))
		console.log(oldTimezone - timezone)
		this.Timezone = timezone
	}
	getTime() {
		// ? Turns out against a regular date in javascript, we're 2 days ahead somehow?
		// ^ Tested with year 52 and js year of 2022
		const big = typeof(this.getFullYear(true)) === 'bigint'
		const divby4 = (this.getFullYear(true) % BigInt(4)) === BigInt(0)
		const divby100 = (this.getFullYear(true) % BigInt(100)) === BigInt(0)
		const divby400 = (this.getFullYear(true) % BigInt(400)) === BigInt(0)
		const leap =  divby4 && !(divby100 && !divby400) // Whether or not the current year is a leap year
		console.log(leap, divby4,divby100,divby400)
		const monthdays = [31,60,91,122,152,182,213,243,274,304,334,365] // Hand-assembled list of how far we are into the current year month-by-month
		let yearcompletion = monthdays[this.getMonth()-1] + (leap && this.getMonth() > 1 ? 1 : 0)
		const ms = this.milliseconds + (this.seconds*1000) + (this.minutes*60*1000) + (this.hours*60*60*1000) + ((yearcompletion + this.date)*24*60*60*1000)
		const x = big ? BigInt(ms) + (this.getFullYear(true) * BigInt(365.24*24*60*60*1000)) : ms + (this.getFullYear() * 365.24*24*60*60*1000)
		return x
	}
	getTimezoneOffset() {
		return this.Timezone*60
	}
	setTimezoneOffset(offset) {
		this.Timezone = offset*60
	}
	getFullYear(big = false) {
		return big ? this.FullYearBig : super.getFullYear()
	}
	setFullYear(year) {
		const big = typeof(year) === 'bigint'
		super.setFullYear(big ? -1 : year) //-1 equals TOO BIG O CLOCK!!!
		this.FullYearBig = big ? year : BigInt(year);
	}
}

// Reads binary up to ANY length, does NOT care!

function bitReader(string,options = {LEndian: true, signed: false}) {
	size = string.length
	string = options.LEndian ? string : string.split('').reverse().join('')
	const big = size >= 63
	let num
	if(big) {
		num = BigInt(0)
	} else {
		num = 0
	}
	let q
	let l
	if(options.signed && string[size-1] === "1") {
		l = size-1
		num += big ? BigInt(-Math.pow(2,size)/2) : -Math.pow(2,size)/2
	} else {
		l = size
	}
	for(let i = 0; i < l; i++) {
		if(string[i] === q && !(i === size-1 && options.signed)) {
			num += big ? BigInt(Math.pow(2,i)) : Math.pow(2,i)
		}
	}
	return num
}

function bitWriter(number,length,options = {LEndian: true}) {
	const big = typeof number === "bigint"
	binary = ""
	if(big) {
		for(let i = 0; i <= length-1; i++) {
			(number & 	BigInt(Math.pow(2,i))) !== BigInt(0) ? binary += "1" : binary += "0"
		}	
	} else {
		for(let i = 0; i <= length-1; i++) {
			(number & Math.pow(2,i)) !== 0 ? binary += "1" : binary += "0"
		}	
	}
	// console.log(binary)
	if(!options.LEndian) {
		binary = binary.split('').reverse().join('')
	}
	return binary
}

module.exports = {ULongDate, bitReader, bitWriter}