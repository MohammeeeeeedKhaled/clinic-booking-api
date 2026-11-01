class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    // 1. Filtering: Handles exact matches and numeric comparison operators (gte, gt, lte, lt)
    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
        excludedFields.forEach((el) => delete queryObj[el]);

        // Convert operators (gte, gt, lte, lt) to MongoDB syntax ($gte,$gt, etc.)
        // Example: ?consultationFee[gte]=200 becomes { consultationFee: { $gte: '200' } }
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        // // Debugging logs to verify parser behavior
        // console.log('Incoming req.query:', this.queryString);
        // console.log('Final Mongo Filter:', JSON.parse(queryStr));
        this.query = this.query.find(JSON.parse(queryStr));

        return this; // Enable method chaining
    }

    // 2. Sorting: Handles multi-field sorting, defaults to newest first
    sort() {
        if (this.queryString.sort) {
        // Split comma-separated fields into space-separated string for Mongoose
        // Example: ?sort=-averageRating,consultationFee -> '-averageRating consultationFee'
        const sortBy = this.queryString.sort.split(',').join(' ');
        this.query = this.query.sort(sortBy);
        } else {
        // Default sorting: newest records first
        this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    // 3. Field Limiting (Projection): Selects or excludes specific document fields
    limitFields() {
        if (this.queryString.fields) {
        // Example: ?fields=specialization,consultationFee -> 'specialization consultationFee'
        const fields = this.queryString.fields.split(',').join(' ');
        this.query = this.query.select(fields);
        } else {
        // Exclude internal Mongoose version key by default
        this.query = this.query.select('-__v');
        }

        return this;
    }

    // 4. Pagination: Splits dataset across pages based on page and limit parameters
    paginate() {
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 10;
        const skip = (page - 1) * limit;

        // Example: page=2 & limit=5 -> skip=(2-1)*5 = 5 (skips first 5, takes next 5)
        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
    //5-Full-Text Regex Search: Evaluates search terms across multiple native text fields
    search() {
        if (this.queryString.search) {
        // Sanitize input to escape special regex characters and prevent ReDoS attacks
        const sanitizedTerm = this.queryString.search
            .trim()
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Case-insensitive regex pattern
        const searchRegex = new RegExp(sanitizedTerm, 'i');

        // Construct $or filter across doctor specialization and bio
        this.query = this.query.find({
            $or: [
            { specialization: { $regex: searchRegex } },
            { bio: { $regex: searchRegex } },
            ],
        });
        }

        return this; // Enable method chaining
    }
}

module.exports = APIFeatures;