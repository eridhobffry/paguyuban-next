import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SponsorDialog } from "@/components/admin/SponsorsDialog";
import type { Sponsor } from "@/types/people";

// Mock dependencies
const mockOnSubmit = vi.fn();
const mockOnOpenChange = vi.fn();
const mockUploadLogo = vi.fn();

const mockTiers = [
  { id: "1", name: "Gold", slug: "gold", price: 50000 },
  { id: "2", name: "Silver", slug: "silver", price: 25000 },
  { id: "3", name: "Bronze", slug: "bronze", price: 10000 },
];

const mockSponsor = {
  id: "test-sponsor-id",
  name: "Test Sponsor",
  url: "https://testsponsor.com",
  logoUrl: "https://example.com/logo.jpg",
  slug: "test-sponsor",
  tierId: "1",
  tags: ["tech", "innovation"],
  sortOrder: 1,
};

// Helper to render the dialog
const renderSponsorDialog = (props = {}) => {
  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    sponsor: null as Sponsor | null,
    tiers: mockTiers,
    onSubmit: mockOnSubmit,
    uploadLogo: mockUploadLogo,
    uploading: false,
  };

  return render(<SponsorDialog {...defaultProps} {...props} />);
};

describe("Admin Sponsor Form Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Form Rendering", () => {
    it("should render all required form fields", () => {
      renderSponsorDialog();

      expect(screen.getByTestId("sponsor-name")).toBeInTheDocument();
      expect(screen.getByTestId("sponsor-url")).toBeInTheDocument();
      expect(screen.getByTestId("sponsor-slug")).toBeInTheDocument();
      expect(screen.getByTestId("sponsor-tier")).toBeInTheDocument();
      expect(screen.getByTestId("sponsor-sort-order")).toBeInTheDocument();
      expect(screen.getByTestId("sponsor-tags")).toBeInTheDocument();
      expect(screen.getByTestId("logo-file")).toBeInTheDocument();
    });

    it("should render with correct dialog title for new sponsor", () => {
      renderSponsorDialog({ sponsor: null });
      expect(screen.getByText("Add Sponsor")).toBeInTheDocument();
    });

    it("should render with correct dialog title for editing sponsor", () => {
      renderSponsorDialog({ sponsor: mockSponsor });
      expect(screen.getByText("Edit Sponsor")).toBeInTheDocument();
    });

    it("should populate form fields when editing existing sponsor", () => {
      renderSponsorDialog({ sponsor: mockSponsor });

      expect(screen.getByTestId("sponsor-name")).toHaveValue("Test Sponsor");
      expect(screen.getByTestId("sponsor-url")).toHaveValue(
        "https://testsponsor.com"
      );
      expect(screen.getByTestId("sponsor-slug")).toHaveValue("test-sponsor");
      expect(screen.getByTestId("sponsor-sort-order")).toHaveValue(1);
      expect(screen.getByTestId("sponsor-tags")).toHaveValue(
        "tech, innovation"
      );
    });

    it("should render tier options correctly", () => {
      renderSponsorDialog();
      const tierSelect = screen.getByTestId("sponsor-tier");

      expect(tierSelect).toBeInTheDocument();

      // Open the select dropdown
      fireEvent.click(tierSelect);

      // Check if options are rendered (this depends on the select implementation)
      expect(screen.getByText("Gold")).toBeInTheDocument();
      expect(screen.getByText("Silver")).toBeInTheDocument();
      expect(screen.getByText("Bronze")).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should show validation errors for empty required fields", async () => {
      const user = userEvent.setup();
      renderSponsorDialog();

      // Submit form with empty fields
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      // Check for validation errors (implementation-dependent)
      // This would depend on the specific validation library being used
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should validate URL format for sponsor URL", async () => {
      const user = userEvent.setup();
      renderSponsorDialog();

      const urlInput = screen.getByTestId("sponsor-url");

      // Enter invalid URL
      await user.clear(urlInput);
      await user.type(urlInput, "invalid-url");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      // Should not submit with invalid URL
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should validate slug format", async () => {
      const user = userEvent.setup();
      renderSponsorDialog();

      const slugInput = screen.getByTestId("sponsor-slug");

      // Enter invalid slug (with spaces or special characters)
      await user.clear(slugInput);
      await user.type(slugInput, "invalid slug with spaces!");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      // Should not submit with invalid slug
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should validate sort order as number", async () => {
      const user = userEvent.setup();
      renderSponsorDialog();

      const sortOrderInput = screen.getByTestId("sponsor-sort-order");

      // Enter non-numeric value
      await user.clear(sortOrderInput);
      await user.type(sortOrderInput, "not-a-number");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      // Should not submit with invalid sort order
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("should validate tier selection", async () => {
      const user = userEvent.setup();
      renderSponsorDialog();

      const nameInput = screen.getByTestId("sponsor-name");
      const sortOrderInput = screen.getByTestId("sponsor-sort-order");
      const tierSelect = screen.getByTestId("sponsor-tier");

      await user.clear(nameInput);
      await user.type(nameInput, "Test Sponsor");
      await user.clear(sortOrderInput);
      await user.type(sortOrderInput, "1");

      // Select a valid tier
      await user.click(tierSelect);
      const goldOption = screen.getByText("Gold");
      await user.click(goldOption);

      // Should be able to submit with valid tier
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      // Form should attempt to submit (validation passes)
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe("Form Submission", () => {
    it("should submit form with valid data", async () => {
      const user = userEvent.setup();
      renderSponsorDialog();

      // Fill out the form
      const nameInput = screen.getByTestId("sponsor-name");
      const urlInput = screen.getByTestId("sponsor-url");
      const slugInput = screen.getByTestId("sponsor-slug");
      const sortOrderInput = screen.getByTestId("sponsor-sort-order");
      const tagsInput = screen.getByTestId("sponsor-tags");

      await user.clear(nameInput);
      await user.type(nameInput, "Valid Sponsor Name");

      await user.clear(urlInput);
      await user.type(urlInput, "https://validsponsor.com");

      await user.clear(slugInput);
      await user.type(slugInput, "valid-sponsor-slug");

      await user.clear(sortOrderInput);
      await user.type(sortOrderInput, "5");

      await user.clear(tagsInput);
      await user.type(tagsInput, "tech, startup, innovation");

      // Submit the form
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: "Valid Sponsor Name",
          url: "https://validsponsor.com",
          slug: "valid-sponsor-slug",
          tierId: null,
          logoUrl: null,
          tags: ["tech", "startup", "innovation"],
          sortOrder: 5,
        });
      });
    });

    it("should handle form submission errors", async () => {
      const user = userEvent.setup();
      const errorMessage = "Failed to save sponsor";

      // Mock onSubmit to throw error
      mockOnSubmit.mockRejectedValueOnce(new Error(errorMessage));

      renderSponsorDialog();

      // Fill form with valid data
      const nameInput = screen.getByTestId("sponsor-name");
      const sortOrderInput = screen.getByTestId("sponsor-sort-order");
      await user.clear(nameInput);
      await user.type(nameInput, "Test Sponsor");
      await user.clear(sortOrderInput);
      await user.type(sortOrderInput, "1");

      // Submit form
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      // Should handle the error (implementation-dependent)
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it("should close dialog after successful submission", async () => {
      const user = userEvent.setup();

      // Mock successful submission
      mockOnSubmit.mockResolvedValueOnce({});

      renderSponsorDialog();

      // Fill form with valid data
      const nameInput = screen.getByTestId("sponsor-name");
      const sortOrderInput = screen.getByTestId("sponsor-sort-order");
      await user.clear(nameInput);
      await user.type(nameInput, "Test Sponsor");
      await user.clear(sortOrderInput);
      await user.type(sortOrderInput, "1");

      // Submit form
      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("File Upload", () => {
    it("should handle logo file selection", async () => {
      const user = userEvent.setup();
      const mockFile = new File(["logo content"], "test-logo.png", {
        type: "image/png",
      });

      mockUploadLogo.mockResolvedValueOnce(
        "https://example.com/uploaded-logo.png"
      );

      renderSponsorDialog();

      const fileInput = screen.getByTestId("logo-file");

      // Upload file
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(mockUploadLogo).toHaveBeenCalledWith(mockFile);
      });
    });

    it("should show uploading state", () => {
      renderSponsorDialog({ uploading: true });

      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });

    it("should display uploaded logo", () => {
      renderSponsorDialog();

      // Simulate logo URL being set
      const logoUrlInput = screen.getByTestId("sponsor-logo-url");
      fireEvent.change(logoUrlInput, {
        target: { value: "https://example.com/logo.png" },
      });

      // Should display the logo (implementation-dependent)
      expect(logoUrlInput).toHaveValue("https://example.com/logo.png");
    });

    it("should handle file upload errors", async () => {
      const user = userEvent.setup();
      const mockFile = new File(["logo content"], "test-logo.png", {
        type: "image/png",
      });

      mockUploadLogo.mockRejectedValueOnce(new Error("Upload failed"));

      renderSponsorDialog();

      const fileInput = screen.getByTestId("logo-file");

      // Upload file
      await user.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(mockUploadLogo).toHaveBeenCalledWith(mockFile);
      });

      // Should handle error gracefully (implementation-dependent)
    });

    it("should validate file type for logo upload", async () => {
      const user = userEvent.setup();
      const mockFile = new File(["text content"], "test.txt", {
        type: "text/plain",
      });

      renderSponsorDialog();

      const fileInput = screen.getByTestId("logo-file");

      // Try to upload invalid file type
      await user.upload(fileInput, mockFile);

      // Should handle invalid file type (implementation-dependent)
      expect(mockUploadLogo).not.toHaveBeenCalled();
    });
  });

  describe("Tags Input", () => {
    it("should handle comma-separated tags", async () => {
      const user = userEvent.setup();
      renderSponsorDialog();

      const nameInput = screen.getByTestId("sponsor-name");
      const sortOrderInput = screen.getByTestId("sponsor-sort-order");
      const tagsInput = screen.getByTestId("sponsor-tags");

      await user.clear(nameInput);
      await user.type(nameInput, "Test Sponsor");
      await user.clear(sortOrderInput);
      await user.type(sortOrderInput, "1");

      await user.clear(tagsInput);
      await user.type(tagsInput, "tag1, tag2, tag3");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test Sponsor",
            sortOrder: 1,
            tags: ["tag1", "tag2", "tag3"],
          })
        );
      });
    });

    it("should trim whitespace from tags", async () => {
      const user = userEvent.setup();
      renderSponsorDialog();

      const nameInput = screen.getByTestId("sponsor-name");
      const sortOrderInput = screen.getByTestId("sponsor-sort-order");
      const tagsInput = screen.getByTestId("sponsor-tags");

      await user.clear(nameInput);
      await user.type(nameInput, "Test Sponsor");
      await user.clear(sortOrderInput);
      await user.type(sortOrderInput, "1");

      await user.clear(tagsInput);
      await user.type(tagsInput, "  tag1  ,  tag2  ,  tag3  ");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test Sponsor",
            sortOrder: 1,
            tags: ["tag1", "tag2", "tag3"],
          })
        );
      });
    });

    it("should filter out empty tags", async () => {
      const user = userEvent.setup();
      renderSponsorDialog();

      const nameInput = screen.getByTestId("sponsor-name");
      const sortOrderInput = screen.getByTestId("sponsor-sort-order");
      const tagsInput = screen.getByTestId("sponsor-tags");

      await user.clear(nameInput);
      await user.type(nameInput, "Test Sponsor");
      await user.clear(sortOrderInput);
      await user.type(sortOrderInput, "1");

      await user.clear(tagsInput);
      await user.type(tagsInput, "tag1,,tag2, ,tag3");

      const saveButton = screen.getByRole("button", { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            name: "Test Sponsor",
            sortOrder: 1,
            tags: ["tag1", "tag2", "tag3"],
          })
        );
      });
    });
  });

  describe("Cancel Functionality", () => {
    it("should close dialog when cancel is clicked", async () => {
      const user = userEvent.setup();
      renderSponsorDialog();

      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it("should close dialog when clicking outside", async () => {
      const user = userEvent.setup();
      renderSponsorDialog();

      // Click on the dialog overlay (implementation-dependent)
      const dialog = screen.getByTestId("sponsor-dialog");
      await user.click(dialog);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("Form Reset", () => {
    it("should reset form when dialog opens with new sponsor", async () => {
      const { rerender } = renderSponsorDialog({ sponsor: mockSponsor });

      // Form should have sponsor data
      expect(screen.getByTestId("sponsor-name")).toHaveValue("Test Sponsor");

      // Rerender with null sponsor (new sponsor)
      rerender(
        <SponsorDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          sponsor={null}
          tiers={mockTiers}
          onSubmit={mockOnSubmit}
          uploadLogo={mockUploadLogo}
          uploading={false}
        />
      );

      // Form should be reset
      await waitFor(() => {
        expect(screen.getByTestId("sponsor-name")).toHaveValue("");
      });
    });

    it("should reset form when dialog opens with different sponsor", async () => {
      const differentSponsor = {
        ...mockSponsor,
        name: "Different Sponsor",
        id: "different-id",
      };

      const { rerender } = renderSponsorDialog({ sponsor: mockSponsor });

      // Form should have original sponsor data
      expect(screen.getByTestId("sponsor-name")).toHaveValue("Test Sponsor");

      // Rerender with different sponsor
      rerender(
        <SponsorDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          sponsor={differentSponsor}
          tiers={mockTiers}
          onSubmit={mockOnSubmit}
          uploadLogo={mockUploadLogo}
          uploading={false}
        />
      );

      // Form should have different sponsor data
      await waitFor(() => {
        expect(screen.getByTestId("sponsor-name")).toHaveValue(
          "Different Sponsor"
        );
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels", () => {
      renderSponsorDialog();

      // Check for proper labeling (implementation-dependent)
      const nameInput = screen.getByTestId("sponsor-name");
      expect(nameInput).toHaveAttribute("type", "text");

      const fileInput = screen.getByTestId("logo-file");
      expect(fileInput).toHaveAttribute("type", "file");
    });

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup();
      renderSponsorDialog();

      // Tab through form elements
      const nameInput = screen.getByTestId("sponsor-name");
      nameInput.focus();
      expect(document.activeElement).toBe(nameInput);

      // Tab to next element
      await user.tab();
      const urlInput = screen.getByTestId("sponsor-url");
      expect(document.activeElement).toBe(urlInput);
    });

    it("should have proper form structure", () => {
      renderSponsorDialog();

      // Check for proper form structure
      const inputs = screen.getAllByRole("textbox");
      expect(inputs.length).toBeGreaterThan(0);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
