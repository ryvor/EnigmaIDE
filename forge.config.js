module.exports = {
	packagerConfig: {
		appBundleId: "com.ryvor.EnigmaIDE",
		icon: "./src/front/assets/icons/enigma",
		/*
		osxSign: {},
		osxNotarize: {
			tool: 'notarytool',
			appleId: process.env.APPLE_ID,
			appleIdPassword: process.env.APPLE_PASSWORD,
			teamId: process.env.APPLE_TEAM_ID
		}
		*/
	},
	makers: [
		{	name: "@electron-forge/maker-dmg",
			config: {
				name: 'Enigma',
				title: 'Enigma IDE',
				authors: 'Ryvor',
				icon: "./src/front/assets/icons/enigma.icns",

			},
		},{	name: "@electron-forge/maker-squirrel",
			config: {
				name: 'Enigma IDE',
				authors: 'Ryvor',
				exe: 'Enigma IDE installer Windows x64.exe',
				iconUrl: "./src/front/assets/icons/enigma.ico",
				setupIcon: "./src/front/assets/icons/enigma.ico",
				//remoteReleases: 'https://path/to/remote/releases',
				//loadingGif: 'path/to/loading.gif',
				certificateFile: './cert.pfx',
				certificatePassword: process.env.CERTIFICATE_PASSWORD

			},
		},{	name: "@electron-forge/maker-deb",
			config: {
				icon: "./src/front/assets/icons/enigma.png",
			},
		}
	],
	plugins: [],
	hooks: {},
};