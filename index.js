const remark = require("remark");
const visit = require("unist-util-visit");
const query = require("vsmarketplace-api");

const source = `
This is a test markdown string for this.

[VS Marketplace for go](https://marketplace.visualstudio.com/items?itemName=ms-vscode.Go)
`;

// NOTE: Haven't plugged this into a Gatsby-transformer-remark plugin yet.

const tree = remark().parse(source);

visit(tree, "link", function(node) {
  // If the link includes the vs marketplace URL, go parse it
  if (node.url.includes("https://marketplace.visualstudio.com")) {
    const extensionId = node.url.split("?")[1].split("=")[1];

    // Query VS Marketplace API
    query(extensionId).then(data => {
      const extension = data.results[0].extensions[0];

      console.log(extension);

      const displayName = extension.displayName;

      const publisher = extension.publisher.displayName;

      const installs = extension.statistics.filter(
        stat => stat.statisticName === "install"
      )[0].value;

      const updates = extension.statistics.filter(
        stat => stat.statisticName === "updateCount"
      )[0].value;

      const totalDownloads = installs + updates;

      const shortDescription = extension.shortDescription;

      const _iconUrl = extension.versions[0].files.filter(
        file =>
          file.assetType === "Microsoft.VisualStudio.Services.Icons.Default"
      );
      const iconUrl = _iconUrl.length > 0 ? _iconUrl[0].source : "";

      const _ratingCount = extension.statistics.filter(
        stat => stat.statisticName === "ratingcount"
      );
      const ratingCount = _ratingCount.length > 0 ? _ratingCount[0].value : 0;

      const _averageRating = extension.statistics.filter(
        stat => stat.statisticName === "averagerating"
      );
      const averageRating =
        _averageRating.length > 0 ? _averageRating[0].value : 0;

      const filledStars = parseInt(averageRating.toFixed(0));
      const notFilledStars = 5 - filledStars;

      let stars = "";

      for (let i = 0; i < filledStars; i++) {
        stars += `<img src="https://cdn.vsassets.io/v/M140_20181002.7/_content/FullStar.svg" />\n`;
      }

      for (let i = 0; i < notFilledStars; i++) {
        stars += `<img src="https://cdn.vsassets.io/v/M140_20181002.7/_content/EmptyStarDark.svg" />\n`;
      }

      // HTML which will be passed back to the AST so it can be rendered in Gatsby
      const html = `
        <a href="${node.url}">
          <img src="${iconUrl}" />
          <div>
            <div>
              <b>${displayName}</b>
              <div>
                ${stars}
                <span>(${ratingCount})</span>
              </div>
            </div>
            <div>
              <span>${publisher}</span>
              <span>${totalDownloads} installs</span>
            </div>
            <div>
              <p>${shortDescription}</p>
            </div>
          </div>
        </a>
      `;

      console.log(html);
    });
  }
});
