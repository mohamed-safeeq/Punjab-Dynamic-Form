async function fetchPincodes() {
    try {
        const response = await fetch("https://67c6ecf8c19eb8753e77efdc.mockapi.io/api/v1/pincode");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Pincode Data:", data);
        return data;
    } catch (error) {
        console.error("Error fetching pincodes:", error);
    }
}

fetchPincodes();
