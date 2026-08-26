export function envDependant<T>(prodValue: T, devValue: T) {
	if ("production" === APP_ENV) {
		return devValue;
	}

	return prodValue;
}
