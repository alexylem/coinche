var Config = {
	// Main title of your project, used in the header & navbar
	title: 'ProjectPages',

	// Display your navbar title as a dropdown for discovering your other projects
	projectpages: [ // false to disable
		/*
		{
			icon: 'asterisk' // for "glyphicon glyphicon-asterisk" (see http://getbootstrap.com/components)
			title: ''
			url: ''
		}, {...}
		*/
		{icon: 'home', title: 'iHome', url: 'http://domotiquefacile.fr'},
		{icon: 'picture', title: 'MyPhotos', url: 'https://github.com/alexylem/myphotos#myphotos'},
		{icon: 'play-circle', title: 'Coinche', url: 'http://alexylem.github.io/coinche/'},
		{icon: 'wrench', title: 'Builder' },
		{icon: 'bullhorn', title: 'ProjectPage', url: 'https://github.com/alexylem/projectpage'},
		{icon: 'globe', title: 'Moeata Creations', url: 'http://moeatacreations.fr'}
	],

	// Enable Disqus comments (https://publishers.disqus.com/engage)
	comments: true,

	// Choose a Bootwatch theme (https://bootswatch.com/) ex: 'united'
	theme: false, // false to keep vanilla Bootstrap theme

	// These are the main sections of your ProjectPage
	sections: [
		/* Section Cheat-Sheet, do not uncomment
		{
			type: 'text|jumbotron|carousel'
			link: 'Navbar link label'
			id: 'navbar-link-id' (used for linking & scrollspy)
			title: 'Big title'
			text: 'This text supports **Github flavored Markdown**' // https://help.github.com/articles/markdown-basics
			icon: 'asterisk' // for "glyphicon glyphicon-asterisk" (see http://getbootstrap.com/components)
			image: 'img/image.png'
			icons: [{
				icon: 'asterisk',
				title: 'Short title'
				text: 'Short text for this icon'
			}, {...}]


Type           | Title           | Icon        | Text             | Image      | Grid
---------------|-----------------|-------------|------------------|------------|-------
(none) OR text | Full width <H2> | Button icon | (N/A) Side text  | Side image | (N/A)
jumbotron      | Jumbotron <H1>  | (N/A)       | Slogan           | Background | (N/A)
grid           | Icon title      | (N/A)       | Icon description | (N/A)      | Cells
carousel       |                 |             |                  | Background | (N/A)

		}
		*/
		{
			type: 'jumbotron',
			title: "{ ProjectPage }",
			text: 'Simple. Structured. Modern.',
			image: 'https://placeimg.com/720/286/tech/sepia',
		},{
			text: "**ProjectPage** is a *simple* modern-looking single project page template you can fill via configuration file.\n\nThis page is built upon *ProjectPage*."
		},{
			link: 'Key features',
			id: 'features',
			grid: [{
				icon: 'gift',
				title: 'Free',
				text: "*ProjectPage* is free to download and to use! Why not giving it a try?"
			},{
				icon: 'phone',
				title: 'Responsive',
				text: 'Your *ProjectPage* will render well on Smartphones, Tablets & PCs'
			},{
				icon: 'list',
				title: 'No wiziwig hassle',
				text: 'Structured. Just fill-in the config file and your site is ready. '
			},{
				icon: 'save-file',
				title: 'Mardown support',
				text: "Quickly write formatted paragraphs with plain text markup."
			},{
				icon: 'comment',
				title: 'Comments module',
				text: "Easily enable *Disqus* integration for social discussions with your community"
			},{
				icon: 'signal',
				title: 'Evolutive',
				text: "Your *ProjectPage* will continue to improve with the latest webdesign codes. No need to change your config!"
			}]
		},{
			title: 'Example of config file',
			text:
			"This is an insight of this page's config.js:\n"+
			"``` js\n"+
			"var Config = {\n"+
			"    title: 'ProjectPage'\n"+
			"    comments: true,\n"+
			"    theme: false,\n"+
			"    sections: [{\n"+
			"        type: 'jumbotron',\n"+
			"        title: '{ ProjectPage }',\n"+
			"        text: 'Simple. Structured. Modern.'\n"+
			"        image: 'https://placeimg.com/720/286/tech/sepia'\n"+
			"    },{\n"+
			"        text: '**ProjectPage** is a *simple* modern-looking single project page template you can fill via configuration file.'\n"+
			"    }]\n"+
			"};\n"+
			"```\n\n"+
			"> `text` properties are *Markdown* enabled. You can [link](#), **format**, :), and [many more](https://markdown-it.github.io/)..."
		},{
			title: 'Sections',
			text:  "There are different types of questions"
		},{
			link: 'Install',
			id: 'install',
			title: 'Installation',
			image: 'https://placeimg.com/300/300/tech',
			text:
			"1) [Download]() *ProjectPage* and dump it on a static webserver\n"+
			"2) Copy `config.RENAME-ME.js` into `config.js`\n"+
			"> :warning: If you directly modify `config.RENAME-ME.js` you will loose your changes on the next *ProjectPage* update.\n"+
			"3) Modify `config.js` to set-up your *ProjectPage*\n"+
			"> The default config file is well commented to guide you\n\n"+
			":bulb: GitHub can [host your ProjectPage](https://pages.github.com). If you do so, you can set-up a secured online edition link for your site:\n"+
			"```\n"+
			"[edit](https://github.com/USERNAME/REPONAME/edit/gh-pages/js/config.js)\n"+
			"```"
		},{
			link: 'Support',
			id: 'support',
			title: 'Get support',
			image: 'https://placeimg.com/300/300/tech/grayscale',
			text:
			"* :book: Check out the [Documentation]()\n"+
			"* :question: A question? Please [post a comment :speech_balloon:](#disqus_thread) below\n"+
			"* :fire: [Report an issue]()\n"+
			"* :bulb: [Submit a feature request]()\n"+
			"> *ProjectPage* is built with :heart: on my own time, any kind of support is more than welcome:\n"+
			"* :busts_in_silhouette: [Contribute to ProjectPage]() and join the team\n"+
			"* :loudspeaker: Spread the word!\n"+
			'<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">'+
				'<input type="hidden" name="cmd" value="_s-xclick">'+
'<input type="hidden" name="hosted_button_id" value="KUY4CUFXEYDR2">'+
'<input type="image" src="http://megaicons.net/static/img/icons_sizes/40/110/32/paypal-icon.png" border="0" name="submit"> Get me a coffee'+
'</form>'
		}
	],
	footer: 'Alexandre Mély - [:pencil2:](https://github.com/alexylem/coinche/edit/gh-pages/js/config.js)'
};
