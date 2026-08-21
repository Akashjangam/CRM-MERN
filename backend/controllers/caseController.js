import Case from "../models/Case.js";

// GET all cases
export const getCases = async (req, res) => {
  try {
    const cases = await Case.find().populate("customer");

    res.status(200).json({
      success: true,
      data: cases,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get cases",
      error: error.message,
    });
  }
};

// CREATE a new case
export const createCase = async (req, res) => {
  try {
    const {
      customer,
      title,
      description,
      priority,
      status,
    } = req.body;

    // Input validation
    if (!customer || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "Customer, title and description are required",
      });
    }

    const newCase = await Case.create({
      customer,
      title,
      description,
      priority,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Case created successfully",
      data: newCase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create case",
      error: error.message,
    });
  }
};

// UPDATE a case
export const updateCase = async (req, res) => {
  try {
    const updatedCase = await Case.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Case updated successfully",
      data: updatedCase,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update case",
      error: error.message,
    });
  }
};

// DELETE a case
export const deleteCase = async (req, res) => {
  try {
    const deletedCase = await Case.findByIdAndDelete(
      req.params.id
    );

    if (!deletedCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Case deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete case",
      error: error.message,
    });
  }
};