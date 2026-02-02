<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreShiftTemplateRequest;
use App\Services\ShiftTemplateService;

class ShiftTemplatesController extends Controller
{
    public function __construct(
        private ShiftTemplateService $shiftTemplateService
    ) {}

    public function getTemplates()
    {
        $templates = $this->shiftTemplateService->listTemplates();

        return $this->responseJSON($templates, 'success', 200);
    }

    public function createTemplate(StoreShiftTemplateRequest $request)
    {
        $template = $this->shiftTemplateService->createTemplate($request->validated());

        return $this->responseJSON($template, 'success', 201);
    }
}
