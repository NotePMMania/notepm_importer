const debugPrint = (obj: any) => {
	const d = new Date;
	const jdt = new Date(d.getTime() + 9 * 60 * 60 * 1000);
	console.log(jdt.toISOString(), obj);
}

export {
	debugPrint
};
