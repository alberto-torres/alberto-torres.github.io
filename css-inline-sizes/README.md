README.MD

# CSS Inline Sizes

CSS inline sizes is a CSS technique used as a content reflow fix for images displayed on your web pages. The page load is smoother because the image sizes are considered part of the [critical inline css](https://www.smashingmagazine.com/2015/08/understanding-critical-css/). 

You may use this method in: 

- Static regular images
- Responsive images that fill the container
- Art directed images to display a completely different image per media query rule.
- Images with multiple resolutions, 2x and such
- Any mix of the options above

## Demo

The full documentation for the demo can be seen [here](https://ixi.studio/content-reflow-fix-css-inline-sizes/). To use the demo: 

- Load the demo in your web browser
- Lower your bandwidth using the inspector tool on your browser and reload the page.
- Use the responsive design mode to resize the screen as the page loads.

### Links: 

- [Demo with regular page load](https://alberto-torres.github.io/css-inline-sizes/images.html)
- [Demo with Lazysizes](https://alberto-torres.github.io/css-inline-sizes/images-lazysizes.html)

Do you see any fluctuation in the layout as the page loads? 
So far the answer has been: no

## How it works? 

To apply the css inline sizes fix add the different image sizes in the inline critical CSS. You may target images via an ID attribute. Let me show you examples:

### Art directed images

HTML
```html
<figure class="ixi-picture" data-id="img-1">
	<picture class="ixi-picture__picture ixi-picture__placeholder">
		<source media="(min-width: 1025px)" srcset="imgs/1-large-landscape.png, imgs/1-large-landscape@2x.png 2x">
		<source media="(min-width: 700px)" srcset="imgs/1-medium-landscape.png, imgs/1-medium-landscape@2x.png 2x">
		<source media="(max-width: 699px)" srcset="imgs/1-small-square.png, imgs/1-small-square@2x.png 2x">
		<img alt="" class="ixi-picture__img" src="imgs/1-small-square.png">
	</picture>
</figure>
```

CSS

```css
/* IMG placeholder graphic */

.ixi-picture__placeholder {   
   background-color: #ffffd9; 
   display: inline-block;
}

/* Media queries for image sizes */

[data-id='img-1'] .ixi-picture__img {
	height: 325px;
	width: 325px 
}

@media only screen and (min-width: 700px) {
	[data-id='img-1'] .ixi-picture__img {
		height: 410px;
		width: 600px 
	}
}

@media only screen and (min-width: 1025px) {
	[data-id='img-1'] .ixi-picture__img {
		height: 700px;
		width: 1024px 
	}
}
```

### Responsive + art directed images

HTML
```html
<figure class="ixi-picture ixi-picture--fluid" data-id="img-8">
	<picture class="ixi-picture__picture ixi-picture__placeholder">
		<source media="(min-width: 1025px)" srcset="imgs/8-large-landscape.png, imgs/8-large-landscape@2x.png 2x">
		<source media="(min-width: 700px)" srcset="imgs/8-medium-landscape.png, imgs/8-medium-landscape@2x.png 2x">
		<source media="(max-width: 699px)" srcset="imgs/8-small-square.png, imgs/8-small-square@2x.png 2x">
		<img alt="" class="ixi-picture__img" src="imgs/8-small-square.png">
	</picture>
</figure>
```


CSS
```css
/* IMG placeholder graphic */

.ixi-picture__placeholder {   
   background-color: #ffffd9; 
   display: inline-block;
}

/* Fluid picture */

.ixi-picture--fluid { 
	display: flex;
	align-items: stretch;
	justify-content: center;
	flex-direction: column;

}

	.ixi-picture--fluid .ixi-picture__picture {
		align-items: center;
		display: inline-flex;
		margin: 0 !important;
		max-width: 100%;
		max-height: 100%;
		min-width: 100%;
		min-height: 100%;
	}

	.ixi-picture--fluid .ixi-picture__img {
		min-width: 100%;
		min-height: 100%;
	}

/* Media queries for image sizes */

/* Image size is 325x325 */

[data-id='img-2'] .ixi-picture__picture {
	padding-top: calc( (325 / 325) * 100%);
	position: relative;
}

	[data-id='img-2'] .ixi-picture__img {
		width: 325px;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
	}

@media only screen and (min-width: 700px) {

	/* Image size is 600x410 */
	[data-id='img-2'] .ixi-picture__picture  {
		padding-top: calc(410 / 600 * 100%);
		width: 600px 
	}

}

@media only screen and (min-width: 1025px) {

	/* Image size is 1024x700 */
	[data-id='img-2'] .ixi-picture__picture {
		padding-top: calc(700 / 1024 * 100%);
		width: 1024px 
	}

}
```


To see a full explanation of the demo, please read the [full article](https://ixi.studio/content-reflow-fix-css-inline-sizes/). 

