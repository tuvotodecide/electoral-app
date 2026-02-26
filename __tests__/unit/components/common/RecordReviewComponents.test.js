import * as RecordReviewComponents from '../../../../src/components/common/RecordReviewComponents';

describe('RecordReviewComponents exports', () => {
  it('expone componentes principales', () => {
    expect(RecordReviewComponents.RecordHeader).toBeDefined();
    expect(RecordReviewComponents.InstructionsContainer).toBeDefined();
    expect(RecordReviewComponents.PhotoContainer).toBeDefined();
    expect(RecordReviewComponents.PartyTable).toBeDefined();
    expect(RecordReviewComponents.VoteSummaryTable).toBeDefined();
    expect(RecordReviewComponents.ActionButtons).toBeDefined();
  });

  it('expone aliases por compatibilidad', () => {
    expect(RecordReviewComponents.RecordHeaderComponent).toBeDefined();
    expect(RecordReviewComponents.InstructionsContainerComponent).toBeDefined();
    expect(RecordReviewComponents.PhotoContainerComponent).toBeDefined();
    expect(RecordReviewComponents.PartyTableComponent).toBeDefined();
    expect(RecordReviewComponents.VoteSummaryTableComponent).toBeDefined();
    expect(RecordReviewComponents.ActionButtonsComponent).toBeDefined();
  });
});
