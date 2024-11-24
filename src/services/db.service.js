const Links = require("../model/Links");

class DbService {
  async saveLink({ song, artist, title, links, createdAt }) {
    try {
      const options = {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      };

      const result = await Links.findOneAndUpdate(
        { song, artist },
        {
          song,
          artist,
          title,
          links,
          createdAt,
        },
        options
      );

      return {
        status: "success",
        data: result,
      };
    } catch (error) {
      console.error("Database save error:", error);
      throw new Error(`Database operation failed: ${error.message}`);
    }
  }

  async getAllLinks() {
    try {
      const links = await Links.find();
      return links;
    } catch (error) {
      console.error("Database fetch error:", error);
      throw new Error(`Failed to fetch links: ${error.message}`);
    }
  }

  async findLinkById(id) {
    try {
      const link = await Links.findById(id);
      return link;
    } catch (error) {
      console.error("Database fetch error:", error);
      throw new Error(`Failed to fetch link: ${error.message}`);
    }
  }

  async deleteLink(id) {
    try {
      await Links.findByIdAndDelete(id);
    } catch (error) {
      console.error("Database delete error:", error);
      throw new Error(`Failed to delete link: ${error.message}`);
    }
  }
}

module.exports = DbService;
