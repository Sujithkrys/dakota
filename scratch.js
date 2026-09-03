const testEndpoints = async () => {
  // Test 1: access_token POST
  try {
    const res1 = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "client_id=dummy&client_secret=dummy&grant_type=authorization_code&redirect_uri=dummy&code=dummy"
    });
    console.log("POST /oauth/access_token ->", await res1.text());
  } catch(e) { console.log(e); }

  // Test 2: long lived token GET
  try {
    const res2 = await fetch("https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=dummy&access_token=dummy");
    console.log("GET /access_token ->", await res2.text());
  } catch(e) { console.log(e); }

  // Test 3: get profile GET
  try {
    const res3 = await fetch("https://graph.instagram.com/v24.0/me?fields=user_id,username,profile_picture_url&access_token=dummy");
    console.log("GET /v24.0/me ->", await res3.text());
  } catch(e) { console.log(e); }
};

testEndpoints();
