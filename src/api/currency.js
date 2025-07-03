export async function getCurrencyPrices(currencies) {
	const codes = new URLSearchParams();

	for(const currency of currencies) {
		codes.append('symbols', currency);
	}

	const url = 'https://api.g.alchemy.com/prices/v1/tokens/by-symbol?' + codes;
	const headers = {
		'Accept': 'application/json',
		'Authorization': 'Bearer -3kPQX60UVLDZWONGLNGEEAn89cn0C8g'
	};

	try {
		const response = fetch(url, {
			method: 'GET',
			headers: headers
		});

		return response;
	} catch (error) {
		console.error('Error fetching prices:' + error);
	}
}