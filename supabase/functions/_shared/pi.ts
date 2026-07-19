// Server-side verification of a Pi Network access token.
// Calls the Pi Platform `/me` endpoint; a valid token returns the account.

export interface PiUser {
  uid: string
  username: string
}

export async function verifyPiToken(token: string): Promise<PiUser> {
  if (!token) throw new Error("Missing Pi access token")
  const res = await fetch("https://api.minepi.com/v2/me", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error("Invalid or expired Pi token")
  const data = await res.json()
  if (!data?.uid) throw new Error("Pi token did not resolve to an account")
  return { uid: String(data.uid), username: String(data.username ?? "pioneer") }
}
