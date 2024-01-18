## [1.51.1](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.51.0...v1.51.1) (2024-01-18)


### Bug Fixes

* signal selection issues ([672881a](https://github.com/newrelic/nr-labs-hedgehog/commit/672881a254bfc52e43e1247568dbc084467a7177))

# [1.51.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.50.0...v1.51.0) (2024-01-17)


### Bug Fixes

* pass accountId and user to flow writer ([ea0fb79](https://github.com/newrelic/nr-labs-hedgehog/commit/ea0fb79d760ab1ec8ed0cf1be4077420980db82f))
* right align flow header actions ([ddea5ca](https://github.com/newrelic/nr-labs-hedgehog/commit/ddea5cae1b1433f3dd0126151d762866c5a206bd))


### Features

* signals context with signals details ([5d8b4a3](https://github.com/newrelic/nr-labs-hedgehog/commit/5d8b4a364de2100e5f9d9e1ef8dd366eb70a1ca4))

# [1.50.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.49.0...v1.50.0) (2024-01-16)


### Features

* add actionControlButton for flow settings modal ([ec17cb6](https://github.com/newrelic/nr-labs-hedgehog/commit/ec17cb64b0307772f18cc8774d683d9ba249465a))
* add flow refresh interval constant ([eef8fda](https://github.com/newrelic/nr-labs-hedgehog/commit/eef8fda940a0055080a12827ca33c80d965dde73))
* add flow settings modal component ([67e9c7d](https://github.com/newrelic/nr-labs-hedgehog/commit/67e9c7d4746988ec192c3ca55cda1a0d6956e2a2))
* add hook to obtain account name ([36e44cf](https://github.com/newrelic/nr-labs-hedgehog/commit/36e44cff7f58eb18b0eb69e3d6bf6b80a75a2f8e))

# [1.49.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.48.0...v1.49.0) (2024-01-12)


### Bug Fixes

* issue with signal selection nerdlet not closing on save ([2b1b957](https://github.com/newrelic/nr-labs-hedgehog/commit/2b1b9577893e2a4a3ca82e4f41cb75c44d1b0407))
* remove unused function ([aff75ed](https://github.com/newrelic/nr-labs-hedgehog/commit/aff75ed1f376776c865de651658bb5efa65c5227))


### Features

* add accounts to app context ([40a1931](https://github.com/newrelic/nr-labs-hedgehog/commit/40a1931f87c9ed6c81a20aa8555014c99046ff2c))
* app context ([cf06a0a](https://github.com/newrelic/nr-labs-hedgehog/commit/cf06a0a13dbcf5c2079b441c1d22a1391a254a7f))
* export flow ([cfcd2f1](https://github.com/newrelic/nr-labs-hedgehog/commit/cfcd2f15728730adf1d2c2b0bc36d035f3f9868c))

# [1.48.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.47.0...v1.48.0) (2024-01-11)


### Bug Fixes

* set default values to handle undefined values being passed ([6a1abd8](https://github.com/newrelic/nr-labs-hedgehog/commit/6a1abd8d40911ab6e2bfc01863983f285bf0250a))


### Features

* updated signal statuses calculation ([012aca5](https://github.com/newrelic/nr-labs-hedgehog/commit/012aca53a37913ca93d7ac5d78c3836b8d51cd2b))

# [1.47.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.46.0...v1.47.0) (2024-01-11)


### Bug Fixes

* distinguish between zero and empty string ([7e54646](https://github.com/newrelic/nr-labs-hedgehog/commit/7e54646de031cf2b46c35f8129419f554c08d0e2))


### Features

* add function to format date/time for kpi hover ([d50c6ac](https://github.com/newrelic/nr-labs-hedgehog/commit/d50c6acc8b2c5223bb93536b2f827e132c13ce69))

# [1.46.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.45.0...v1.46.0) (2023-12-29)


### Features

* signal selection nerdlet ([56dcaae](https://github.com/newrelic/nr-labs-hedgehog/commit/56dcaae82757222356d2ad60fd965dfd71f0573f))

# [1.45.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.44.1...v1.45.0) (2023-12-25)


### Features

* add kpi hover for additional kpi info ([326e096](https://github.com/newrelic/nr-labs-hedgehog/commit/326e09675eab5b8585bf5af9153658e2f8924e1d))
* get metadata for kpi nrql queries ([02eca99](https://github.com/newrelic/nr-labs-hedgehog/commit/02eca993c7ba8ecb524b8ab4701fd0e220277a71))

## [1.44.1](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.44.0...v1.44.1) (2023-12-12)


### Bug Fixes

* resolves [#123](https://github.com/newrelic/nr-labs-hedgehog/issues/123) - flowlist dropdown does not change flows ([4442f11](https://github.com/newrelic/nr-labs-hedgehog/commit/4442f110ec61e03c210206356674b014dd3f55f8))

# [1.44.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.43.0...v1.44.0) (2023-11-07)


### Bug Fixes

* issues with stage updates not displaying ([5960d72](https://github.com/newrelic/nr-labs-hedgehog/commit/5960d7290f661d8e616acc20914331f8ad2097b9))


### Features

* using reducer for data updates ([112ae26](https://github.com/newrelic/nr-labs-hedgehog/commit/112ae2681b90ff0c71bc5b76826cf8b8d2767a11))

# [1.43.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.42.4...v1.43.0) (2023-11-01)


### Features

* use contexts for data handling ([65b76b5](https://github.com/newrelic/nr-labs-hedgehog/commit/65b76b5c5be659d16dd53751dc7270c402923b17))

## [1.42.4](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.42.3...v1.42.4) (2023-10-17)


### Bug Fixes

* stage shape getting overwritten ([6206331](https://github.com/newrelic/nr-labs-hedgehog/commit/6206331746b87e81bb79cc1b48f97ccb1dc7ff2f))

## [1.42.3](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.42.2...v1.42.3) (2023-10-17)


### Bug Fixes

* calculating statuses issue ([e02e380](https://github.com/newrelic/nr-labs-hedgehog/commit/e02e380dc1cd0d5e4f5f118933fe4f69a958493c))

## [1.42.2](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.42.1...v1.42.2) (2023-10-17)


### Bug Fixes

* add IDs to stage components ([75cf2c5](https://github.com/newrelic/nr-labs-hedgehog/commit/75cf2c55792ce5f8a7986bfb4aace8761776afe6))
* issues with adding step and stage ([58e2f35](https://github.com/newrelic/nr-labs-hedgehog/commit/58e2f357dc53ba72a7599d5586b0701ee8131fe9))

## [1.42.1](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.42.0...v1.42.1) (2023-10-11)


### Bug Fixes

* handle deleted service levels ([be0af2e](https://github.com/newrelic/nr-labs-hedgehog/commit/be0af2ef46f42edb6b479ea702d31d95d7c85505))

# [1.42.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.41.0...v1.42.0) (2023-10-11)


### Features

* flow list updates ([ec0aca9](https://github.com/newrelic/nr-labs-hedgehog/commit/ec0aca9216641610339211809ffe3782fc82152e))

# [1.41.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.40.0...v1.41.0) (2023-10-09)


### Features

* get started page ([783159d](https://github.com/newrelic/nr-labs-hedgehog/commit/783159d6b329a5c52bc435d5c9a55ac2675e1b04))

# [1.40.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.39.1...v1.40.0) (2023-10-06)


### Bug Fixes

* adding newline to eof for json files ([8b6605f](https://github.com/newrelic/nr-labs-hedgehog/commit/8b6605f2a9d88572aa8a2dd65c105ddc83c10fd4))
* remove console log ([9f3abaf](https://github.com/newrelic/nr-labs-hedgehog/commit/9f3abafe968960d15715e900f8b4d17188a75857))


### Features

* adding refs for flow and flowlist ([04eb69d](https://github.com/newrelic/nr-labs-hedgehog/commit/04eb69d96ba44ce82f37cdec272767742b65aa6c))
* product tour nerdlet ([3ddfb83](https://github.com/newrelic/nr-labs-hedgehog/commit/3ddfb836a29126f6629460384dd3f2877864e9d0))

## [1.39.1](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.39.0...v1.39.1) (2023-09-26)


### Bug Fixes

* handle empty steps in levels ui ([1c77999](https://github.com/newrelic/nr-labs-hedgehog/commit/1c779994e66f725d25d13e9eec077f063823f40f))
* remove useref in levels ([b36458e](https://github.com/newrelic/nr-labs-hedgehog/commit/b36458e4d2bf53bd80113c3bb074bdb7218d5794))

# [1.39.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.38.0...v1.39.0) (2023-09-25)


### Bug Fixes

* add collapsible text on kpi modal frame to display query instructions and sample queries ([988858a](https://github.com/newrelic/nr-labs-hedgehog/commit/988858a151235533ffc0253e922afa79d3e0bc19))
* eslint error ([6d11a4f](https://github.com/newrelic/nr-labs-hedgehog/commit/6d11a4fbca2b05854256f6aa29eeefc8130b2e85))
* stop kpi value from wrapping to next line ([4e0e385](https://github.com/newrelic/nr-labs-hedgehog/commit/4e0e385d8ece753a9124f09316c563d308586920))


### Features

* add kpi alias, billboard and nrql editor instructions, query editor prompt ([d5ec436](https://github.com/newrelic/nr-labs-hedgehog/commit/d5ec43684d5a374ecde240696a500a78f75da720))
* add nrql syntax color to kpi-modal nrql samples ([89f02b3](https://github.com/newrelic/nr-labs-hedgehog/commit/89f02b30cf0224f3cbc8be74180de893dad56e0f))
* use kpi alias in billboard if it's added ([1a259f3](https://github.com/newrelic/nr-labs-hedgehog/commit/1a259f3fb38c6f7a69ce605d6dd0b6ea2475cf60))

# [1.38.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.37.1...v1.38.0) (2023-09-22)


### Bug Fixes

* add newline to end of file ([67ee889](https://github.com/newrelic/nr-labs-hedgehog/commit/67ee889ab777d69b9e54deb40fd213c3ec8ccebc))


### Features

* sidebar component ([fafe61f](https://github.com/newrelic/nr-labs-hedgehog/commit/fafe61fde8bbdaf2284d06cc585a9009105e43b4))

## [1.37.1](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.37.0...v1.37.1) (2023-09-22)


### Bug Fixes

* update ui for levels ([255ed7d](https://github.com/newrelic/nr-labs-hedgehog/commit/255ed7dc1cf22a177ee86e4ae91c39454224d26b))

# [1.37.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.36.0...v1.37.0) (2023-08-26)


### Features

* add segmented control for stacked/inline buttons to flow header ([0c04da6](https://github.com/newrelic/nr-labs-hedgehog/commit/0c04da6ed9d7ddc3720e404f2a6e82e679360870))

# [1.36.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.35.2...v1.36.0) (2023-08-24)


### Features

* display save status on save ([afb5dae](https://github.com/newrelic/nr-labs-hedgehog/commit/afb5dae4b4aa37db40d8ef39896edd219691904a))

## [1.35.2](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.35.1...v1.35.2) (2023-08-16)


### Bug Fixes

* rename step groups to level ([16a123c](https://github.com/newrelic/nr-labs-hedgehog/commit/16a123c44d0bb75acbf41c47466ec1086db76aeb))

## [1.35.1](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.35.0...v1.35.1) (2023-08-16)


### Bug Fixes

* eslint errors ([a83e48e](https://github.com/newrelic/nr-labs-hedgehog/commit/a83e48e2d2ae1f71a94fb2bf8e8f39454130afcb))

# [1.35.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.34.0...v1.35.0) (2023-08-15)


### Bug Fixes

* adding optional chanining as fail-safe ([1229f3e](https://github.com/newrelic/nr-labs-hedgehog/commit/1229f3ebe50ad9cac4e4a758ba68e00fb6209ba0))


### Features

* use fetch user hook to get current user details ([ddaf101](https://github.com/newrelic/nr-labs-hedgehog/commit/ddaf1010cec6df9f0a5b8ccce4d93e0ed2147ae5))
* use flow writer hook to add audit trail on create and update flows ([394dcd8](https://github.com/newrelic/nr-labs-hedgehog/commit/394dcd836c2c6ab7ddd2c6a58bd234cd1af5eb91))

# [1.34.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.33.0...v1.34.0) (2023-08-11)


### Features

* add kpi bar title tooltip ([0b5e10d](https://github.com/newrelic/nr-labs-hedgehog/commit/0b5e10db0639b8f2ab143329a44325ea29c89ecf))
* add tooltip to kpi-bar title ([64e8083](https://github.com/newrelic/nr-labs-hedgehog/commit/64e8083a962a36fd2fcfcdb21044eb4080558b4f))

# [1.33.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.32.0...v1.33.0) (2023-07-27)


### Bug Fixes

* eslint errors ([f37b5cb](https://github.com/newrelic/nr-labs-hedgehog/commit/f37b5cb692e7e1928affd29cb6c37c249ebd01a3))


### Features

* display edit-mode banner ([47bf150](https://github.com/newrelic/nr-labs-hedgehog/commit/47bf150a7ecb4e3a25d09084330be3672e65bf82))

# [1.32.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.31.0...v1.32.0) (2023-07-26)


### Features

* add kpi drag-n-drop ([780abd1](https://github.com/newrelic/nr-labs-hedgehog/commit/780abd1fe29874055b13c7a940261ec48d1a8392))

# [1.31.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.30.1...v1.31.0) (2023-07-26)


### Features

* drag and drop for steps ([1c216c4](https://github.com/newrelic/nr-labs-hedgehog/commit/1c216c4dc8893311ae43d7ddb948e689e049af03))

## [1.30.1](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.30.0...v1.30.1) (2023-07-23)


### Bug Fixes

* flows UI when inserting/removing flows from list ([84f5740](https://github.com/newrelic/nr-labs-hedgehog/commit/84f5740c048a22678def200e16967edc3685f9ea))

# [1.30.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.29.0...v1.30.0) (2023-07-15)


### Features

* drag and drop for step groups ([a3ab458](https://github.com/newrelic/nr-labs-hedgehog/commit/a3ab4587f69028aa265d42ab7b4aec4da6b54944))

# [1.29.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.28.0...v1.29.0) (2023-07-13)


### Features

* drag and drop for stages ([f52eb9c](https://github.com/newrelic/nr-labs-hedgehog/commit/f52eb9cfb31da433260ee13adff3a056d19eb011))

# [1.28.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.27.0...v1.28.0) (2023-07-13)


### Bug Fixes

* design updates ([15d571b](https://github.com/newrelic/nr-labs-hedgehog/commit/15d571bb478ad5267e21eea8be0d30e6f939712b))
* guids not sent array of guids to edit step modal; style updates for signal ([c221651](https://github.com/newrelic/nr-labs-hedgehog/commit/c2216518b7ce928a88c27a1c5badb4c3ea322d17))
* replace text with constant ([4c6bd0d](https://github.com/newrelic/nr-labs-hedgehog/commit/4c6bd0d84c24add51375b234bebfcc7ac1ce02b7))


### Features

* add and delete signals ([bec6ff0](https://github.com/newrelic/nr-labs-hedgehog/commit/bec6ff07c7ab00675b725e6cf7f3ba781bb67e62))

# [1.27.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.26.0...v1.27.0) (2023-07-11)


### Features

* display spinner while flows are being loaded ([6420d46](https://github.com/newrelic/nr-labs-hedgehog/commit/6420d46a66c92c414dfeaef333d7ff7f90e9d74a))

# [1.26.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.25.0...v1.26.0) (2023-07-09)


### Bug Fixes

* eslint errors ([6965ed5](https://github.com/newrelic/nr-labs-hedgehog/commit/6965ed5797b34405f3f319d64fdb047e9e9117cb))


### Features

* add action control buttons + additional props to Flow component ([86507ad](https://github.com/newrelic/nr-labs-hedgehog/commit/86507ad829c807e0ca897242b79f0009481c43ed))
* add logic for selecting / deleting a flow + style updates ([aa1bf3f](https://github.com/newrelic/nr-labs-hedgehog/commit/aa1bf3f71689709aaf7df5e3f9771a0d24adb28f))
* load newly created flow  after clicking the 'create new flow' button and set mode to edit ([ca25ac7](https://github.com/newrelic/nr-labs-hedgehog/commit/ca25ac7fd1f6ea1d72ebf0af3c3413269b132a60))

# [1.25.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.24.0...v1.25.0) (2023-06-23)


### Features

* add flow list dropdown ([0b89b8a](https://github.com/newrelic/nr-labs-hedgehog/commit/0b89b8afe3722f8048cfad5538caa39fa6495cfb))
* add flow list dropdown source and styles to components files ([158c591](https://github.com/newrelic/nr-labs-hedgehog/commit/158c59155cfcc93354394b4bab057b9080f124db))

# [1.24.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.23.2...v1.24.0) (2023-06-23)


### Features

* delete step group ([9a00454](https://github.com/newrelic/nr-labs-hedgehog/commit/9a004543663a7247619e807ae9a7194872401337))
* edit step name and delete step functionality ([9655e18](https://github.com/newrelic/nr-labs-hedgehog/commit/9655e1803ca8c839d0658800242edb5629288300))
* renaming delete stage modal to delete confirm modal to support other types ([9173307](https://github.com/newrelic/nr-labs-hedgehog/commit/91733078f04144d3f530e99cd856b00dd5464079))

## [1.23.2](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.23.1...v1.23.2) (2023-06-23)


### Bug Fixes

* center flow header in kiosk mode ([b357444](https://github.com/newrelic/nr-labs-hedgehog/commit/b357444beb94d26ae07bda1c8985222a99c4a8b5))

## [1.23.1](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.23.0...v1.23.1) (2023-06-23)


### Bug Fixes

* change initial input text to placeholder; disable add step button till step name is typed out ([52d89e3](https://github.com/newrelic/nr-labs-hedgehog/commit/52d89e345fb8790e432dc17e7341a3f365d024c4))
* place steps in separate rows when in edit mode ([84af77d](https://github.com/newrelic/nr-labs-hedgehog/commit/84af77d6a26eb78d8fc63eac5f10665ed0d7fd87))

# [1.23.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.22.0...v1.23.0) (2023-06-22)


### Bug Fixes

* eslint updates; updated stage shape icon names; missing icon in edit flow ([cd103ea](https://github.com/newrelic/nr-labs-hedgehog/commit/cd103eaf4401e9f31ddf96483239b8b4607d4192))


### Features

* add pathpoint logo to icons library ([71621e2](https://github.com/newrelic/nr-labs-hedgehog/commit/71621e28c2a6419b6073313d164911bfc9ce007e))

# [1.22.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.21.0...v1.22.0) (2023-06-22)


### Features

* add step ([4cc1f50](https://github.com/newrelic/nr-labs-hedgehog/commit/4cc1f501a62dcf5c9df595f496a55cc0b884af16))

# [1.21.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.20.1...v1.21.0) (2023-06-22)


### Features

* add kpi-bar slider ([63d7861](https://github.com/newrelic/nr-labs-hedgehog/commit/63d7861f906d47c6e627f5745ca50c8b0d7e92c9))

## [1.20.1](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.20.0...v1.20.1) (2023-06-22)


### Bug Fixes

* css class name clash ([461c980](https://github.com/newrelic/nr-labs-hedgehog/commit/461c980746cc76deffbe2a1ec56ffc375dd9b7b4))
* stage shape indexes ([c4146ea](https://github.com/newrelic/nr-labs-hedgehog/commit/c4146eac6e0aebe7e31c13884fc2a6cc3a9d58da))

# [1.20.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.19.0...v1.20.0) (2023-06-21)


### Bug Fixes

* add dependency array for usecallback ([a31aed5](https://github.com/newrelic/nr-labs-hedgehog/commit/a31aed593221d3c747e36bbcb76ae8fb705866ad))


### Features

* edit stage shape ([477b6a9](https://github.com/newrelic/nr-labs-hedgehog/commit/477b6a9d4f54bf9e6126f3300e02094965cb769d))

# [1.19.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.18.2...v1.19.0) (2023-06-21)


### Features

* delete stage ([1addf49](https://github.com/newrelic/nr-labs-hedgehog/commit/1addf493d785af63b6d377d9a9020b5ae3a525a3))

## [1.18.2](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.18.1...v1.18.2) (2023-06-20)


### Bug Fixes

* set correct button type in image upload modal ([95776b8](https://github.com/newrelic/nr-labs-hedgehog/commit/95776b8e6429ccd8069e8739cbfe4dd5739ed84b))

## [1.18.1](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.18.0...v1.18.1) (2023-06-19)


### Bug Fixes

* min width for stage ([4208f00](https://github.com/newrelic/nr-labs-hedgehog/commit/4208f00faa02201b62fc473312d2d71ff60253c8))

# [1.18.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.17.0...v1.18.0) (2023-06-19)


### Features

* move flow header to its own component ([d1c90c7](https://github.com/newrelic/nr-labs-hedgehog/commit/d1c90c7f9f13074aefc84d1ee4b3f5f470115443))

# [1.17.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.16.0...v1.17.0) (2023-06-16)


### Bug Fixes

* action buttons to support modes ([d33410a](https://github.com/newrelic/nr-labs-hedgehog/commit/d33410abc507c551781f98063737c332eb13e605))
* add dependency to memo function ([a98a673](https://github.com/newrelic/nr-labs-hedgehog/commit/a98a673a7fb37e5bcbb0ded501a5aef3bee23b13))
* eslint error and remove commnets ([2b2f734](https://github.com/newrelic/nr-labs-hedgehog/commit/2b2f734c71ce8d1ba9014f57321bbc679cc25c72))
* eslint errors ([38d95e0](https://github.com/newrelic/nr-labs-hedgehog/commit/38d95e0e3d6a14d25d8642f8529ee26894986647))
* method name conflict ([01233e0](https://github.com/newrelic/nr-labs-hedgehog/commit/01233e0b03e2b46c74db49ed9f559500132f7cc4))
* use flow object to obtain id ([f2098eb](https://github.com/newrelic/nr-labs-hedgehog/commit/f2098eba028c858f2649fbda7c13bcace1687c52))


### Features

* add flow list and search ([7562442](https://github.com/newrelic/nr-labs-hedgehog/commit/756244281cde63fad8c61090d8e5a060e8becd6f))
* use flow list component in home ([816fa3f](https://github.com/newrelic/nr-labs-hedgehog/commit/816fa3f1f7c6a19fa8c667ef278e895f1a3b128c))

# [1.16.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.15.0...v1.16.0) (2023-06-15)


### Features

* edit stage; and new stages component ([6abdb50](https://github.com/newrelic/nr-labs-hedgehog/commit/6abdb5022470abb1fd17012b10e261592fc5045b))

# [1.15.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.14.0...v1.15.0) (2023-06-02)


### Bug Fixes

* minor updates to how objects are checked for emptiness ([d23d014](https://github.com/newrelic/nr-labs-hedgehog/commit/d23d014362495df0961abeb094358addfcce9579))


### Features

* created flowUpdateHandler callback ([4c83c65](https://github.com/newrelic/nr-labs-hedgehog/commit/4c83c65b78663aa7d94e7998545060388eafe18f))
* edit mode for flow ([1c5becd](https://github.com/newrelic/nr-labs-hedgehog/commit/1c5becdbc9608898b4a15124182b23dc7280edbd))
* set up newFlowHandler callback ([3d99599](https://github.com/newrelic/nr-labs-hedgehog/commit/3d995990a35102909a64043f8e63f24e242e61af))

# [1.14.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.13.0...v1.14.0) (2023-06-02)


### Features

* flow component ([6400dc0](https://github.com/newrelic/nr-labs-hedgehog/commit/6400dc0a6997314722b5db6d3fdd77bc40d1d847))

# [1.13.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.12.1...v1.13.0) (2023-06-02)


### Features

* useFlowLoader hook (replaces useFetchFlows hook) ([f2ac4c0](https://github.com/newrelic/nr-labs-hedgehog/commit/f2ac4c062e818631d6f535e16be021c259a485de))

## [1.12.1](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.12.0...v1.12.1) (2023-06-01)


### Bug Fixes

* adding checks for results ([dce561c](https://github.com/newrelic/nr-labs-hedgehog/commit/dce561c5020f11200f2eeb976df688f0229c6ee2))

# [1.12.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.11.0...v1.12.0) (2023-06-01)


### Features

* uuid util ([fb053f0](https://github.com/newrelic/nr-labs-hedgehog/commit/fb053f0fcfe9ba6dec9b56f457a7795c6b2c77e9))

# [1.11.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.10.0...v1.11.0) (2023-05-31)


### Features

* add kpi bar component ([d7df53c](https://github.com/newrelic/nr-labs-hedgehog/commit/d7df53c18ed4c3752436b0f7ac5883e4ce671649))
* add kpi-bar ([7bfe9c7](https://github.com/newrelic/nr-labs-hedgehog/commit/7bfe9c70568cad088d34bfbffa62d2bb42938f0f))

# [1.10.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.9.0...v1.10.0) (2023-05-26)


### Bug Fixes

* add dependencies ([69a4f40](https://github.com/newrelic/nr-labs-hedgehog/commit/69a4f400a174fb99de94de72a50a433e0ebd4117))
* eslint errors ([a3561a7](https://github.com/newrelic/nr-labs-hedgehog/commit/a3561a7825cc1310aaf1d0ce9ab162827e438049))
* eslint errors ([5f5c5b0](https://github.com/newrelic/nr-labs-hedgehog/commit/5f5c5b06c950a950bcc260269a360c42e0b2cefd))
* typo ([9bcf278](https://github.com/newrelic/nr-labs-hedgehog/commit/9bcf278e3747f76ee82ca1c62d22ebc67c385be8))


### Features

* add kpi modal component ([696627d](https://github.com/newrelic/nr-labs-hedgehog/commit/696627da836a618acea96705ce0fa29bf0e5f462))
* add modal kpi component ([c387ac1](https://github.com/newrelic/nr-labs-hedgehog/commit/c387ac19b7340f5b6101dfded3bc8711db783142))

# [1.9.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.8.1...v1.9.0) (2023-05-25)


### Features

* stage component ([4fad7db](https://github.com/newrelic/nr-labs-hedgehog/commit/4fad7dba4d4f599da81f1c214a30abb4dfc9f296))

## [1.8.1](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.8.0...v1.8.1) (2023-05-25)


### Bug Fixes

* refactor to prep for stage ([1ee25a5](https://github.com/newrelic/nr-labs-hedgehog/commit/1ee25a50a3b3baa09b01d78d413eaea3bcb88e37))
* use locally defined constant ([3a59d7a](https://github.com/newrelic/nr-labs-hedgehog/commit/3a59d7a652de972c856ae59e81157a60670b0963))

# [1.8.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.7.0...v1.8.0) (2023-05-24)


### Features

* step group component ([6098a12](https://github.com/newrelic/nr-labs-hedgehog/commit/6098a120de342c6b34601f610f79a593e2a979fe))

# [1.7.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.6.0...v1.7.0) (2023-05-18)


### Features

* step component ([efae155](https://github.com/newrelic/nr-labs-hedgehog/commit/efae155f032a8e6fb7a759456227e66fd28a2186))

# [1.6.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.5.0...v1.6.0) (2023-05-16)


### Bug Fixes

* null actor kyes ([b091568](https://github.com/newrelic/nr-labs-hedgehog/commit/b09156854d2448b51f12c03de308e8bb2280f9eb))


### Features

* useFetchKpiValues hook ([1749fbd](https://github.com/newrelic/nr-labs-hedgehog/commit/1749fbd7ed1c65df2040c225e881797ea54e3b3a))

# [1.5.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.4.1...v1.5.0) (2023-05-12)


### Bug Fixes

* cleaning up useFetchServiceLevels hook ([3a9f3a3](https://github.com/newrelic/nr-labs-hedgehog/commit/3a9f3a31212d1840f16fea6dc2ca713e1a59331b))


### Features

* useFetchServiceLevels hook ([e099a39](https://github.com/newrelic/nr-labs-hedgehog/commit/e099a398dd5cc259b77e264f739f5559d94aa47e))

## [1.4.1](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.4.0...v1.4.1) (2023-05-08)


### Bug Fixes

* warning status for service levels; add type to signal ([bb38697](https://github.com/newrelic/nr-labs-hedgehog/commit/bb386970aa096de291db3587b60aea4c787c8253))

# [1.4.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.3.0...v1.4.0) (2023-05-04)


### Features

* signals list component ([064bb09](https://github.com/newrelic/nr-labs-hedgehog/commit/064bb0974be70c8a2bbf6be6233192c2761e4a78))

# [1.3.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.2.0...v1.3.0) (2023-05-04)


### Features

* signal component ([7296233](https://github.com/newrelic/nr-labs-hedgehog/commit/7296233a7fb3741bd5a42ce832984bc6b363c5d2))

# [1.2.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.1.0...v1.2.0) (2023-05-03)


### Features

* edit step modal ([60823ac](https://github.com/newrelic/nr-labs-hedgehog/commit/60823ac3b0498d919031c569f40c82c19d159203))

# [1.1.0](https://github.com/newrelic/nr-labs-hedgehog/compare/v1.0.0...v1.1.0) (2023-03-29)


### Features

* adding an icons library component ([983e0bb](https://github.com/newrelic/nr-labs-hedgehog/commit/983e0bb305cdcdb418dc9dc67fd3482a6dd3b1bd))

# 1.0.0 (2023-03-28)


### Bug Fixes

* adding required files ([3d29a73](https://github.com/newrelic/nr-labs-hedgehog/commit/3d29a73cfa140eb7805f7e2ad17b4244b7d93c13))


### Features

* set up and adding noflows component ([2fc08f1](https://github.com/newrelic/nr-labs-hedgehog/commit/2fc08f1cc071eea421279c0fe7cb6352fd4004df))
