module.exports = function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
    eleventyConfig.addPassthroughCopy("src/app.js");

    eleventyConfig.addFilter("citations", (text) => {
        return text.replace(/\{\{cite:(\d+)\}\}/g, (_, n) =>
            `<sup id="ref-${n}" class="citation-ref"><a href="#cite-${n}">[${n}]</a></sup>`
        );
    });

    return {
        pathPrefix: "/",
        dir: {
            input: "src",
            includes: "_includes",
            data: "_data",
            output: "_site"
        }
    };
};
