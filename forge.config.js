module.exports = {
	packagerConfig: {
		appBundleId: "com.ryvor.EnigmaIDE",
		icon: '	/src/front/assets/icons/enigma',
	},
	makers: [
		{
			name: '@electron-forge/maker-squirrel',
			config: {
				// An URL to an ICO file to use as the application icon (displayed in Control Panel > Programs and Features).
				iconUrl: '/src/front/assets/icons/enigma.ico',
				// The ICO file to use as the icon for the generated Setup.exe
				setupIcon: '/src/front/assets/icons/enigma.ico',
			},
		}, {
			// Path to a single image that will act as icon for the application
			name: '@electron-forge/maker-deb',
			config: {
				options: {
				icon: '/src/front/assets/icons/enigma.png',
				},
			},
		}, {
			// Path to the icon to use for the app in the DMG window
			name: '@electron-forge/maker-dmg',
			config: {
				icon: '/src/front/assets/icons/enigma.icns',
			},
		}, {
			name: '@electron-forge/maker-wix',
			config: {
				icon: '/src/front/assets/icons/enigma.ico',
			},
		},
	],
	plugins: [],
	hooks: {},
};