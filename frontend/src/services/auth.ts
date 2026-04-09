import type { LoginData, RegisterData, AuthResponse } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

class AuthService {
	async login(data: LoginData): Promise<AuthResponse> {
		const response = await fetch(`${API_URL}/api/auth/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Erreur de connexion");
		}

		const result: AuthResponse = await response.json();
		return result;
	}

	async register(data: RegisterData): Promise<AuthResponse> {
		const response = await fetch(`${API_URL}/api/auth/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Erreur d'inscription");
		}

		const result: AuthResponse = await response.json();
		return result;
	}
}

export const authService = new AuthService();