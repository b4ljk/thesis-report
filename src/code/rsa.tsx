/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-explicit-any */
import bigInt from "big-integer";
import { useMemo, useState } from "react";
import { generateKeyPairSync } from "crypto";
import { generateRSAkeys } from "~/lib/rsa";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import * as forge from "node-forge";
import jsbn from "jsbn";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import toast from "react-hot-toast";

function isProbablyPrime(n: bigInt.BigInteger, k: number): boolean {
	if (n.equals(2) || n.equals(3)) return true;
	if (n.equals(1) || n.isEven()) return false;

	let s = bigInt.zero;
	let d = n.minus(1);

	while (d.isEven()) {
		d = d.divide(2);
		s = s.plus(1);
	}

	for (let i = 0; i < k; i++) {
		const a = bigInt.randBetween(2, n.minus(2));
		let x = a.modPow(d, n);

		if (x.equals(bigInt.one) || x.equals(n.minus(1))) continue;

		let passed = false;
		for (let j = 0; j < Number(s) - 1; j++) {
			x = x.modPow(2, n);
			if (x.equals(1)) return false;
			if (x.equals(n.minus(1))) {
				passed = true;
				break;
			}
		}

		if (!passed) return false;
	}

	return true;
}

function generateLargePrime(numDigits: number): bigInt.BigInteger {
	const min = bigInt(10).pow(numDigits - 1);
	const max = bigInt(10).pow(numDigits).minus(1);

	while (true) {
		const possiblePrime = bigInt.randBetween(min, max);
		if (possiblePrime.isProbablePrime(256)) return possiblePrime;
	}
}

function RSA(bitSize: number) {
	const p = generateLargePrime(bitSize);
	const q = generateLargePrime(bitSize);

	const n = p.multiply(q);
	const phi = p.minus(1).multiply(q.minus(1));

	let e = bigInt(65537);

	while (!e.greater(phi) || bigInt.gcd(e, phi).notEquals(1)) {
		e = e.plus(2);
	}

	const d = e.modInv(phi);

	return {
		publicKey: {
			e,
			n,
		},
		privateKey: {
			d,
			n,
		},
	};
}

const createCihperText = (
	text: string,
	bitSize: number,
	modulus: forge.jsbn.BigInteger,
	exponent: forge.jsbn.BigInteger,
) => {
	if (!text || text.length > bitSize / 8) return;
	let hex = "";
	for (let i = 0; i < text.length; i++) {
		hex += text.charCodeAt(i).toString(16);
	}
	const m = new forge.jsbn.BigInteger(hex, 16);
	const c = m.modPow(exponent, modulus);
	return c.toString();
};

const decipher = (
	cipherText: string,
	bitSize: number,
	modulus: forge.jsbn.BigInteger,
	exponent: forge.jsbn.BigInteger,
	d: forge.jsbn.BigInteger,
) => {
	const c = new forge.jsbn.BigInteger(cipherText);
	const m = c.modPow(d, modulus);
	const hex = m.toString(16);
	let text = "";
	for (let i = 0; i < hex.length; i += 2) {
		text += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
	}
	return text;
};

export default function Cryptography() {
	const [plainText, setPlainText] = useState("");
	const [cipherText, setCipherText] = useState("");
	const [decryptedText, setDecryptedText] = useState("");
	const [bitSize, setBitSize] = useState(2048);
	const [speedMs, setSpeedMs] = useState(0);
	const { publicKey, privateKey } = useMemo(
		() => generateRSAkeys(bitSize),
		[bitSize],
	);
	const [modulus, setModulus] = useState(publicKey.n.toString());
	const [exponent, setExponent] = useState(publicKey.e.toString());
	const [d, setD] = useState(privateKey.d.toString()); //private exponent

	return (
		<div className="container">
			<h1 className="text-3xl font-bold">Криптограф</h1>
			<p className="font-bold text-muted-foreground">RSA</p>
			<div className="flex flex-col gap-6">
				<div className="">
					<Label className="text-muted-foreground">
						Шифрлэх мэдээлэл (Энгийн текст)
					</Label>
					<div className="flex gap-6">
						<Input
							value={plainText}
							onChange={(e) => setPlainText(e.target.value)}
						/>
						<Button
							onClick={() => {
								const start = new Date().getTime();
								const c = createCihperText(
									plainText,
									bitSize,
									new forge.jsbn.BigInteger(modulus),
									new forge.jsbn.BigInteger(exponent),
								);
								const end = new Date().getTime();
								setCipherText(c ?? "");
								setSpeedMs(end - start);
								toast.success(end - start + " ms");
							}}
						>
							Шифрлэх
						</Button>
					</div>
				</div>
				<div className="">
					<Label className="text-muted-foreground">Шифрлэгдсэн мэдээлэл</Label>
					<textarea
						value={cipherText}
						rows={4}
						className={cn(
							"flex  w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
						)}
						onChange={(e) => setCipherText(e.target.value)}
					/>
				</div>
				<Button
					onClick={() => {
						const start = new Date().getTime();
						const text = decipher(
							cipherText,
							bitSize,
							new forge.jsbn.BigInteger(modulus),
							new forge.jsbn.BigInteger(exponent),
							new forge.jsbn.BigInteger(d),
						);
						const end = new Date().getTime();
						setDecryptedText(text);
						setSpeedMs(end - start);
						toast.success(end - start + " ms");
					}}
				>
					Тайлах
				</Button>
				<div className="">
					<Label className="text-muted-foreground">Тайлагдсан мэдээлэл</Label>
					<textarea
						value={decryptedText}
						rows={4}
						onChange={(e) => setDecryptedText(e.target.value)}
						className={cn(
							"flex  w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
						)}
					/>
				</div>
				<div className="">
					<Label className="text-muted-foreground">Модулулус (Modulus)</Label>
					<textarea
						value={modulus}
						onChange={(e) => setModulus(e.target.value)}
						rows={4}
						className={cn(
							"flex  w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
						)}
					/>
				</div>
				<div className="">
					<Label className="text-muted-foreground">
						Нууц түлхүүр (Private Exponent)
					</Label>
					<textarea
						value={d}
						onChange={(e) => setD(e.target.value)}
						rows={4}
						className={cn(
							"flex  w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
						)}
					/>
				</div>
				<div className="">
					<Label className="text-muted-foreground">
						Экспонент (Public Exponent)
					</Label>
					<textarea
						value={exponent}
						onChange={(e) => setExponent(e.target.value)}
						rows={4}
						className={cn(
							"flex  w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
						)}
					/>
				</div>
			</div>
		</div>
	);
}
